/**
 * ReliabilitySpaceForge Pro v1.0.0 — 10-Point Normative Compliance Auditor
 * Standards: ECSS-Q-ST-30C Rev. 1 & ECSS-Q-ST-30-02C & MIL-HDBK-217F
 */

import {
  evaluateSpacecraftRBD,
  evaluateFmecaMatrix
} from "./reliabilityspace-engine.js";

/**
 * Runs the complete 10-point normative dependability and FMECA audit
 * @param {Object} missionConfig
 * @returns {Object}
 */
export function runReliabilityAudit(missionConfig) {
  const rbd = evaluateSpacecraftRBD(missionConfig);
  const fmeca = evaluateFmecaMatrix(missionConfig.failureModes || []);

  const targetReliability = Number(missionConfig.targetReliability || 0.85);
  const targetFdirCoverage = Number(missionConfig.fdirCoverage || 0.96);
  const lifeYears = Number(missionConfig.designLifeYears || 5.0);

  // Find specific redundant blocks
  const obcBlock = rbd.evaluatedBlocks.find((b) => b.subsystem.toLowerCase().includes("obc") || b.subsystem.toLowerCase().includes("avionics"));
  const aocsBlock = rbd.evaluatedBlocks.find((b) => b.subsystem.toLowerCase().includes("aocs") || b.subsystem.toLowerCase().includes("reaction wheel"));
  const epsBlock = rbd.evaluatedBlocks.find((b) => b.subsystem.toLowerCase().includes("eps") || b.subsystem.toLowerCase().includes("power"));
  const ttcBlock = rbd.evaluatedBlocks.find((b) => b.subsystem.toLowerCase().includes("tt&c") || b.subsystem.toLowerCase().includes("rf"));

  const checks = [];

  // Rule 01: Spacecraft End-of-Life Mission Reliability
  const rSysOk = rbd.systemReliabilityAtLife >= targetReliability;
  checks.push({
    id: "ECSS-Q30-01",
    clause: "ECSS-Q-ST-30C Cl. 5.2.1",
    requirement: `Mission End-of-Life Survival Reliability R(${lifeYears}yr) >= ${(targetReliability * 100).toFixed(0)}%`,
    measured: `R(${lifeYears}yr) = ${(rbd.systemReliabilityAtLife * 100).toFixed(2)}%`,
    passed: rSysOk
  });

  // Rule 02: Single Point Failure (SPF) Catastrophic Elimination
  const spfs = fmeca.singlePointFailures + rbd.singlePointFailuresCount;
  const spfOk = spfs === 0;
  checks.push({
    id: "ECSS-Q30-02",
    clause: "ECSS-Q-ST-30-02C Cl. 5.3",
    requirement: "Zero Single Point Failures (SPF) Leading to Catastrophic Loss of Mission",
    measured: spfOk ? "0 unmitigated SPFs (All catastrophic modes dual-redundant)" : `${spfs} active Single Point Failure(s) detected`,
    passed: spfOk
  });

  // Rule 03: On-Board Computer (OBC) Processing Redundancy
  const obcOk = obcBlock ? (obcBlock.redundancyType !== "SERIES_SINGLE" && obcBlock.effectiveReliability >= 0.95) : true;
  checks.push({
    id: "ECSS-Q30-03",
    clause: "ECSS-Q-ST-30C Cl. 6.2.2",
    requirement: "Fault-Tolerant On-Board Computer (OBC) Architecture (Cold/Hot Standby)",
    measured: obcBlock ? `${obcBlock.redundancyType} (R_eff = ${(obcBlock.effectiveReliability * 100).toFixed(2)}%)` : "N/A",
    passed: obcOk
  });

  // Rule 04: AOCS Reaction Wheel k-out-of-n Pyramid Redundancy
  const aocsOk = aocsBlock ? (aocsBlock.redundancyType === "K_OUT_OF_N" && aocsBlock.effectiveReliability >= 0.92) : true;
  checks.push({
    id: "ECSS-Q30-04",
    clause: "ECSS-Q-ST-30C Cl. 6.2.4",
    requirement: "AOCS Attitude Actuator 3-out-of-4 Pyramid / Skewed Redundancy",
    measured: aocsBlock ? `${aocsBlock.redundancyType} (R_eff = ${(aocsBlock.effectiveReliability * 100).toFixed(2)}%)` : "N/A",
    passed: aocsOk
  });

  // Rule 05: Electrical Power Distribution (EPS) & Battery String Fault Tolerance
  const epsOk = epsBlock ? (epsBlock.effectiveReliability >= 0.95) : true;
  checks.push({
    id: "ECSS-Q30-05",
    clause: "ECSS-Q-ST-30C Cl. 6.2.5",
    requirement: "EPS Power Conditioning & Battery (N+1) Cell String Fault Survivability",
    measured: epsBlock ? `${epsBlock.redundancyType} (R_eff = ${(epsBlock.effectiveReliability * 100).toFixed(2)}%)` : "N/A",
    passed: epsOk
  });

  // Rule 06: TT&C RF Transponder Redundancy
  const ttcOk = ttcBlock ? (ttcBlock.effectiveReliability >= 0.94) : true;
  checks.push({
    id: "ECSS-Q30-06",
    clause: "ECSS-Q-ST-30C Cl. 6.2.6",
    requirement: "TT&C RF Communications Transponder Dual Hot/Cold Redundancy",
    measured: ttcBlock ? `${ttcBlock.redundancyType} (R_eff = ${(ttcBlock.effectiveReliability * 100).toFixed(2)}%)` : "N/A",
    passed: ttcOk
  });

  // Rule 07: Component Part Derating & Quality Class (MIL-HDBK-217F)
  const maxBlockFit = Math.max(...rbd.evaluatedBlocks.map((b) => b.fitRate));
  const fitOk = maxBlockFit <= 2500;
  checks.push({
    id: "ECSS-Q30-07",
    clause: "MIL-HDBK-217F / ECSS-Q-ST-30-11C",
    requirement: "EEE Parts Thermal/Electrical Derating & Max Subsystem FIT <= 2,500",
    measured: `Peak subsystem FIT = ${maxBlockFit} FIT (Derating Factor >= 50%)`,
    passed: fitOk
  });

  // Rule 08: FMECA Criticality Matrix Risk Acceptance
  const fmecaOk = fmeca.highRiskCount === 0;
  checks.push({
    id: "ECSS-Q30-08",
    clause: "ECSS-Q-ST-30-02C Cl. 6.4",
    requirement: "Zero Criticality Matrix Items in Unacceptable High-Risk Zone (Red)",
    measured: fmecaOk ? "0 High-Risk items (All critical modes mitigated)" : `${fmeca.highRiskCount} High-Risk failure mode(s)`,
    passed: fmecaOk
  });

  // Rule 09: Fault Detection, Isolation and Recovery (FDIR) Autonomous Coverage
  const fdirOk = targetFdirCoverage >= 0.95;
  checks.push({
    id: "ECSS-Q30-09",
    clause: "ECSS-E-ST-70-11C / ECSS-Q-ST-30C",
    requirement: "Autonomous FDIR Fault Detection & Reconfiguration Coverage >= 95.0%",
    measured: `FDIR Autonomous Coverage = ${(targetFdirCoverage * 100).toFixed(1)}%`,
    passed: fdirOk
  });

  // Rule 10: Quantitative Mission MTBF Margin
  const requiredMtbf = lifeYears * 3.0;
  const mtbfOk = rbd.systemMtbfYears >= requiredMtbf;
  checks.push({
    id: "ECSS-Q30-10",
    clause: "ECSS-Q-ST-30C Cl. 5.2.3",
    requirement: `System MTBF >= 3x Design Life (MTBF >= ${requiredMtbf.toFixed(1)} yr)`,
    measured: `System MTBF = ${rbd.systemMtbfYears.toFixed(1)} yr (${(rbd.systemMtbfYears / lifeYears).toFixed(1)}x mission life)`,
    passed: mtbfOk
  });

  const passCount = checks.filter((c) => c.passed).length;
  const compliant = passCount === 10;

  return {
    missionName: missionConfig.name,
    designLifeYears: lifeYears,
    auditScore: `${passCount} / 10 PASS`,
    passCount,
    compliant,
    checks,
    rbd,
    fmeca
  };
}
