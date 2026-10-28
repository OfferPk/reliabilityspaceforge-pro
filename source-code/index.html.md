

`REL`

# 

ReliabilitySpaceForge Pro

`v1.0.0` `ECSS-Q-ST-30C & ECSS-Q-ST-30-02C`  
Spacecraft Dependability, Reliability Block Diagram (RBD), MTBF & FMECA Criticality Matrix Studio  
MISSION PRESET: Falcon 9 SmallSat (3-Year Life, R \>= 0.85, Cold OBC, 3/4 RW) LEO Mega-Constellation (5-Year Life, R \>= 0.88, Dual Bus) GEO Telecom Flagship (15-Year Life, R \>= 0.90, Class A) Inject Single Point Failure Reset Reliability Export ECSS XML

`Reliability model nominal. DISMISS`

`System Survival R(t)`

`90.12%`

`Target ≥ 85.0% PASS`

`Single Point Failures`

`0 SPFs`

`Full Redundancy Coverage`

`System MTBF`

`30.8 yr`

`10.3× Mission Life Margin`

`FMECA High Risk`

`0 ITEMS`

`Zero Zone-1 Red Hazards`

`ECSS-Q-ST-30C Audit`

`10 / 10 PASS`

`ECSS-Q-ST-30C CERTIFIED`

## 

`1. Mission Lifetime & Redundancy`

`Clause 5.2 / 6.2`

---

Mission Design Life (Years) `3.0 yr`

Required Target Reliability R\_target `0.85 (85.0%)`

Autonomous FDIR Switchover Coverage `96.0%`

Subsystem Redundancy Architecture  
On-Board Computer (OBC): `COLD_STANDBY (P_sw=0.98)`  
AOCS Reaction Wheels: `K_OUT_OF_N (3-of-4)`  
Electrical Power System: `ACTIVE_PARALLEL (N=2)`  
TT\&C RF Transponder: `COLD_STANDBY (P_sw=0.98)`

## 

`2. Spacecraft Reliability Decay Curve R(t) & Subsystem RBD Availability`

Exponential degradation R(t) over mission lifetime, target reliability margin, and block availability bars  
`System R(t) Target Threshold Subsystem R_eff`  
---

`RBD SYSTEM SYNTHESIS`  
`Design Life:3.0 yr`  
`R(t) at EOM:90.12%`  
`Target Requirement:≥ 85.0%`  
`Reliability Margin:+5.12% PASS`

`FAILURE RATE & MTBF`  
`Total Series FIT:3,700 FIT`  
`Equivalent MTBF:30.8 yr`  
`MTBF Ratio:10.3× Life`  
`FDIR Coverage:96.0% (≥ 95%)`

`FMECA CRITICALITY (ECSS-Q-30-02)`  
`Single Point Failures:0 (Limit: 0)`  
`Catastrophic (Sev 1):3 (Mitigated)`  
`Critical (Sev 2):1 (Mitigated)`  
`High Risk (Zone 1):0 Items (PASS)`

## 

`3. ECSS-Q-ST-30C Subsystem Reliability Block Diagram (RBD) Matrix`

Component failure rate derating (MIL-HDBK-217F), series/parallel/standby redundancy, and single-point-failure identification  
`ALL CRITICAL SUBSYSTEMS REDUNDANT (0 SPFs)`

---

| `Block ID` | `Subsystem Component` | `Redundancy Architecture` | `FIT Rate` | `MTBF (yr)` | `Single R(t)` | `Effective R(t)` | `SPF Status` | `Action`   |
| :---- | :---- | :---- | ----: | ----: | ----: | ----: | :---- | ----- |

## 

`4. 10-Point ECSS-Q-ST-30C Rev. 1 & ECSS-Q-ST-30-02C Normative Compliance Auditor`

Automated verification of mission R(t) target, SPF elimination, OBC cold standby, 3/4 RW pyramid, EPS N+1, derating, and FDIR  
`10 / 10 RULES VERIFIED (100%)`

---

| `Rule ID` | `ECSS Clause` | `Verification Requirement` | `Measured Telemetry` | `Verdict`   |
| :---- | :---- | :---- | :---- | ----- |

### 

`ECSS-Q-ST-30C Dependability Manifest (XML Export)`

Copy XML Close

---

