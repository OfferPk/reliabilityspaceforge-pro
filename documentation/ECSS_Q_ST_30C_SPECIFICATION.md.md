# ECSS-Q-ST-30C Rev. 1 & ECSS-Q-ST-30-02C Specification

## Space Product Assurance — Dependability & FMECA Standard

### 1\. Scope & Normative References

This specification defines the mathematical formulations, reliability block modeling rules, and Failure Modes, Effects, and Criticality Analysis (FMECA) algorithms implemented in **ReliabilitySpaceForge Pro (v1.0.0)**. The software enforces strict compliance with:

* **ECSS-Q-ST-30C Rev. 1**: *Space product assurance — Dependability* (ESA/ESTEC, 15 February 2017\)  
* **ECSS-Q-ST-30-02C**: *Space product assurance — Failure modes, effects and criticality analysis (FMECA)*  
* **MIL-HDBK-217F Notice 2**: *Reliability Prediction of Electronic Equipment*  
* **NASA NPR 8705.4A**: *Risk Classification for NASA Payloads*

---

### 2\. Spacecraft Reliability Mathematics

#### 2.1 Exponential Failure Distribution

For constant failure rate \$\\lambda\$ (valid during the useful operating life phase after burn-in and prior to wearout): \$\$R(t) \= e^{-\\lambda t}\$\$ Where \$\\lambda\$ is expressed in Failures In Time (\$\\text{FIT} \= 10^{-9}\\text{ failures/hour}\$): \$\$\\lambda \= \\text{FIT} \\times 10^{-9} \\quad \[\\text{hr}^{-1}\]\$\$ \$\$\\text{MTBF} \= \\frac{1}{\\lambda} \\quad \[\\text{hours}\] \= \\frac{1}{\\lambda \\cdot 8,760} \\quad \[\\text{years}\]\$\$

#### 2.2 Active Parallel Redundancy

For \$n\$ identical units operating concurrently where at least 1 unit is required for mission success: \$\$R\_{\\text{parallel}}(t) \= 1 \- \\prod\_{i=1}^n \\left(1 \- R\_i(t)\\right) \= 1 \- (1 \- R(t))^n\$\$

#### 2.3 Cold Standby Redundancy

For 1 operating unit and 1 unpowered cold standby spare with failure detection and switchover probability \$P\_{\\text{sw}}\$ (\$P\_{\\text{sw}} \\ge 0.98\$ per ECSS-Q-ST-30C): \$\$R\_{\\text{cold\_standby}}(t) \= e^{-\\lambda t} \\cdot \\left(1 \+ P\_{\\text{sw}} \\cdot \\lambda t\\right)\$\$

#### 2.4 \$k\$-out-of-\$n\$ Active Voting Redundancy

For \$n\$ identical active units where at least \$k\$ units must survive (e.g. 3-out-of-4 reaction wheel pyramid or 2-out-of-3 star trackers): \$\$R\_{k/n}(t) \= \\sum\_{j=k}^n \\binom{n}{j} \[R(t)\]^j \[1 \- R(t)\]^{n-j}\$\$ Specifically for a 3-out-of-4 tetrahedral/pyramid configuration: \$\$R\_{3/4}(t) \= 4 R^3 \- 3 R^4\$\$

#### 2.5 System Reliability Block Diagram (RBD) Synthesis

The overall spacecraft mission survival probability is the series product of all essential functional blocks: \$\$R\_{\\text{spacecraft}}(t) \= \\prod\_{m=1}^{M} R\_{\\text{effective}, m}(t)\$\$ Where each \$R\_{\\text{effective}, m}(t)\$ incorporates the local redundancy configuration (standby, parallel, or \$k\$-out-of-\$n\$).

---

### 3\. ECSS-Q-ST-30-02C FMECA Criticality Matrix

#### 3.1 Severity Levels

* **Severity 1 (Catastrophic)**: Loss of spacecraft, loss of life, or launch vehicle failure.  
* **Severity 2 (Critical)**: Loss of primary mission objectives or irreversible system degradation.  
* **Severity 3 (Major)**: Degradation of secondary mission objectives; operational workarounds available.  
* **Severity 4 (Minor)**: Negligible mission performance impact; compensable by flight software.

#### 3.2 Probability Levels

* **Category E (Frequent)**: \$P \\ge 10^{-2}\$ (\$\\ge 10,000\\text{ FIT}\$)  
* **Category D (Probable)**: \$10^{-3} \\le P \< 10^{-2}\$ (\$1,000 \- 10,000\\text{ FIT}\$)  
* **Category C (Occasional)**: \$10^{-4} \\le P \< 10^{-3}\$ (\$100 \- 1,000\\text{ FIT}\$)  
* **Category B (Remote)**: \$10^{-5} \\le P \< 10^{-4}\$ (\$10 \- 100\\text{ FIT}\$)  
* **Category A (Extremely Remote)**: \$P \< 10^{-5}\$ (\$\< 10\\text{ FIT}\$)

#### 3.3 Single Point Failure (SPF) Policy

Per ECSS-Q-ST-30C Clause 6.1:

> "The design shall eliminate all single point failures whose occurrence leads to Catastrophic (Severity 1\) or Critical (Severity 2\) consequences."

Any unmitigated active functional component operating without redundant backup with Severity \$\\le 2\$ is categorized as an active Single Point Failure and fails the compliance audit.