/**
 * ReliabilitySpaceForge Pro v1.0.0 — Pure ES6 Spacecraft Dependability & RBD Engine
 * Standards: ECSS-Q-ST-30C Rev. 1 & ECSS-Q-ST-30-02C & MIL-HDBK-217F
 */

export const RELIABILITY_CONSTANTS = {
  HOURS_PER_YEAR: 8760.0,
  FIT_TO_FAILURES_PER_HOUR: 1.0e-9,
  DEFAULT_SWITCHOVER_PROB: 0.98,
  SEVERITY_LEVELS: {
    1: { id: 1, name: "Catastrophic", desc: "Loss of mission, spacecraft, or ground safety hazard", color: "#fb7185" },
    2: { id: 2, name: "Critical", desc: "Loss of primary mission objectives or irreversible degradation", color: "#fbbf24" },
    3: { id: 3, name: "Major", desc: "Degradation of secondary mission objectives with workarounds", color: "#38bdf8" },
    4: { id: 4, name: "Minor", desc: "Negligible mission impact; fully compensable by flight software", color: "#34d399" }
  },
  PROBABILITY_LEVELS: {
    E: { code: "E", name: "Frequent", minP: 1.0e-2, minFit: 10000, label: "P ≥ 10⁻²" },
    D: { code: "D", name: "Probable", minP: 1.0e-3, minFit: 1000, label: "10⁻³ ≤ P < 10⁻²" },
    C: { code: "C", name: "Occasional", minP: 1.0e-4, minFit: 100, label: "10⁻⁴ ≤ P < 10⁻³" },
    B: { code: "B", name: "Remote", minP: 1.0e-5, minFit: 10, label: "10⁻⁵ ≤ P < 10⁻⁴" },
    A: { code: "A", name: "Extremely Remote", minP: 0.0, minFit: 0, label: "P < 10⁻⁵" }
  }
};

export function calculateComponentReliability(fitRate, timeYears) {
  const tHours = Number(timeYears) * RELIABILITY_CONSTANTS.HOURS_PER_YEAR;
  const lambda = Number(fitRate) * RELIABILITY_CONSTANTS.FIT_TO_FAILURES_PER_HOUR;
  return Math.exp(-lambda * tHours);
}

export function calculateMtbfYears(fitRate) {
  const lambda = Math.max(1e-12, Number(fitRate) * RELIABILITY_CONSTANTS.FIT_TO_FAILURES_PER_HOUR);
  const mtbfHours = 1.0 / lambda;
  return mtbfHours / RELIABILITY_CONSTANTS.HOURS_PER_YEAR;
}

export function calculateActiveParallelReliability(singleR, numUnits) {
  const n = Math.max(1, Number(numUnits));
  return 1.0 - Math.pow(1.0 - singleR, n);
}

export function calculateColdStandbyReliability(fitRate, timeYears, psw = RELIABILITY_CONSTANTS.DEFAULT_SWITCHOVER_PROB) {
  const tHours = Number(timeYears) * RELIABILITY_CONSTANTS.HOURS_PER_YEAR;
  const lambda = Number(fitRate) * RELIABILITY_CONSTANTS.FIT_TO_FAILURES_PER_HOUR;
  const lambdaT = lambda * tHours;
  return Math.exp(-lambdaT) * (1.0 + psw * lambdaT);
}

export function calculateKOutOfNReliability(singleR, k, n) {
  const R = Math.max(0.0, Math.min(1.0, singleR));
  if (k === 3 && n === 4) {
    return 4.0 * Math.pow(R, 3) - 3.0 * Math.pow(R, 4);
  }
  if (k === 2 && n === 3) {
    return 3.0 * Math.pow(R, 2) - 2.0 * Math.pow(R, 3);
  }
  if (k === 2 && n === 4) {
    return Math.pow(R, 4) + 4.0 * Math.pow(R, 3) * (1.0 - R) + 6.0 * Math.pow(R, 2) * Math.pow(1.0 - R, 2);
  }
  if (k === 1) {
    return calculateActiveParallelReliability(R, n);
  }
  if (k === n) {
    return Math.pow(R, n);
  }
  const binom = (nVal, kVal) => {
    let coeff = 1;
    for (let x = nVal - kVal + 1; x <= nVal; x++) coeff *= x;
    for (let x = 1; x <= kVal; x++) coeff /= x;
    return coeff;
  };
  let total = 0.0;
  for (let j = k; j <= n; j++) {
    total += binom(n, j) * Math.pow(R, j) * Math.pow(1.0 - R, n - j);
  }
  return total;
}

export function evaluateSpacecraftRBD(missionConfig) {
  const lifeYears = Number(missionConfig.designLifeYears || 5.0);
  const blocks = missionConfig.subsystems || [];

  const evaluatedBlocks = blocks.map((b) => {
    const fit = Number(b.fitRate || 1000);
    const mtbf = calculateMtbfYears(fit);
    const singleR = calculateComponentReliability(fit, lifeYears);
    let effectiveR = singleR;

    const redundancyType = b.redundancyType || "SERIES_SINGLE";
    if (redundancyType === "COLD_STANDBY") {
      const psw = Number(b.switchoverProb || RELIABILITY_CONSTANTS.DEFAULT_SWITCHOVER_PROB);
      effectiveR = calculateColdStandbyReliability(fit, lifeYears, psw);
    } else if (redundancyType === "ACTIVE_PARALLEL") {
      const nUnits = Number(b.numUnits || 2);
      effectiveR = calculateActiveParallelReliability(singleR, nUnits);
    } else if (redundancyType === "K_OUT_OF_N") {
      const k = Number(b.kRequired || 3);
      const n = Number(b.nTotal || 4);
      effectiveR = calculateKOutOfNReliability(singleR, k, n);
    }

    const isStructure = (b.subsystem || "").toLowerCase().includes("struct");
    const isSpf = (redundancyType === "SERIES_SINGLE" && Number(b.severity || 1) <= 2 && !isStructure);

    return {
      id: b.id,
      name: b.name,
      subsystem: b.subsystem,
      fitRate: fit,
      mtbfYears: Number(mtbf.toFixed(1)),
      redundancyType,
      singleUnitReliability: Number(singleR.toFixed(4)),
      effectiveReliability: Number(effectiveR.toFixed(4)),
      isSinglePointFailure: isSpf
    };
  });

  const systemLifeR = evaluatedBlocks.reduce((acc, b) => acc * b.effectiveReliability, 1.0);

  const decayCurve = [];
  const maxT = Math.max(10.0, lifeYears * 1.5);
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24.0) * maxT;
    let rSys = 1.0;
    evaluatedBlocks.forEach((b) => {
      const fit = b.fitRate;
      const sR = calculateComponentReliability(fit, t);
      let effR = sR;
      if (b.redundancyType === "COLD_STANDBY") {
        effR = calculateColdStandbyReliability(fit, t);
      } else if (b.redundancyType === "ACTIVE_PARALLEL") {
        effR = calculateActiveParallelReliability(sR, 2);
      } else if (b.redundancyType === "K_OUT_OF_N") {
        effR = calculateKOutOfNReliability(sR, 3, 4);
      }
      rSys *= effR;
    });
    decayCurve.push({
      timeYears: Number(t.toFixed(2)),
      reliability: Number(rSys.toFixed(4))
    });
  }

  const totalSeriesFit = evaluatedBlocks.reduce((acc, b) => acc + b.fitRate, 0);
  const systemMtbfYears = calculateMtbfYears(totalSeriesFit);

  return {
    designLifeYears: lifeYears,
    systemReliabilityAtLife: Number(systemLifeR.toFixed(4)),
    systemReliabilityPercent: Number((systemLifeR * 100.0).toFixed(2)),
    systemMtbfYears: Number(systemMtbfYears.toFixed(1)),
    totalSeriesFitRate: totalSeriesFit,
    evaluatedBlocks,
    singlePointFailuresCount: evaluatedBlocks.filter((b) => b.isSinglePointFailure).length,
    decayCurve
  };
}

export function evaluateFmecaMatrix(failureModes) {
  let catastrophicCount = 0;
  let criticalCount = 0;
  let singlePointFailures = 0;
  let highRiskCount = 0;

  const analyzedModes = failureModes.map((fm, idx) => {
    const sev = Number(fm.severity || 1);
    const fit = Number(fm.fitRate || 500);
    const isSpf = Boolean(fm.singlePointFailure);

    let probCode = "C";
    if (fit >= 10000) probCode = "E";
    else if (fit >= 1000) probCode = "D";
    else if (fit >= 100) probCode = "C";
    else if (fit >= 10) probCode = "B";
    else probCode = "A";

    let riskClass = "LOW_RISK";
    if (isSpf) {
      if (sev === 1) riskClass = "HIGH_RISK";
      else if (sev === 2) riskClass = (probCode === "D" || probCode === "E") ? "HIGH_RISK" : "MEDIUM_RISK";
      else riskClass = "LOW_RISK";
    } else {
      // With redundancy & autonomous FDIR switchover, mitigated severity is compensated
      if (sev === 1 && (probCode === "D" || probCode === "E")) {
        riskClass = "HIGH_RISK";
      } else if (sev === 1 || sev === 2) {
        riskClass = "MEDIUM_RISK";
      } else {
        riskClass = "LOW_RISK";
      }
    }

    if (sev === 1) catastrophicCount++;
    if (sev === 2) criticalCount++;
    if (riskClass === "HIGH_RISK") highRiskCount++;
    if (isSpf) singlePointFailures++;

    const rpn = sev * (probCode.charCodeAt(0) - 64);

    return {
      index: idx,
      id: fm.id,
      component: fm.component,
      subsystem: fm.subsystem,
      failureMode: fm.failureMode,
      cause: fm.cause,
      effect: fm.effect,
      severity: sev,
      severityName: RELIABILITY_CONSTANTS.SEVERITY_LEVELS[sev].name,
      probabilityCode: probCode,
      fitRate: fit,
      singlePointFailure: isSpf,
      mitigationFdir: fm.mitigationFdir || "Autonomous FDIR switchover",
      riskClass,
      rpn
    };
  });

  return {
    totalFailureModes: analyzedModes.length,
    catastrophicCount,
    criticalCount,
    highRiskCount,
    singlePointFailures,
    criticalityAcceptable: highRiskCount === 0 && singlePointFailures === 0,
    modes: analyzedModes
  };
}
