#!/usr/bin/env python3
"""
Automated Test Runner for ReliabilitySpaceForge Pro v1.0.0
Validates 10 Core Physical & Normative ECSS-Q-ST-30C & ECSS-Q-ST-30-02C Requirements
"""

import unittest
from reliabilityspace_cli import (
    calc_r_component,
    calc_mtbf_years,
    calc_r_parallel,
    calc_r_cold_standby,
    calc_r_k_of_n,
    evaluate_mission_reliability,
    MISSION_PRESETS
)

class TestReliabilitySpaceForgePro(unittest.TestCase):

    def test_01_exponential_reliability_formula(self):
        """Test 01: Verify component R(t) = exp(-lambda * t)"""
        # 1000 FIT over 1 year = 1000 * 10^-9 * 8760 = 0.00876
        # R(1) = exp(-0.00876) ~= 0.991277
        r = calc_r_component(fit_rate=1000.0, time_years=1.0)
        self.assertAlmostEqual(r, 0.99128, places=4)

    def test_02_mtbf_calculation(self):
        """Test 02: Verify MTBF in years calculation from FIT rate"""
        # 1000 FIT -> lambda = 1e-6 failures/hr -> MTBF = 1e6 hr / 8760 = 114.155 years
        mtbf = calc_mtbf_years(1000.0)
        self.assertAlmostEqual(mtbf, 114.16, delta=0.5)

    def test_03_active_parallel_redundancy(self):
        """Test 03: Verify active parallel redundancy R_parallel = 1 - (1 - R)^n"""
        r_single = 0.90
        r_par = calc_r_parallel(r_single, 2)
        # 1 - (1 - 0.9)^2 = 1 - 0.01 = 0.99
        self.assertAlmostEqual(r_par, 0.99, places=3)

    def test_04_cold_standby_with_switchover(self):
        """Test 04: Verify cold standby reliability with P_sw = 0.98"""
        # Cold standby exceeds single unit reliability
        r_single = calc_r_component(1000.0, 3.0)
        r_cold = calc_r_cold_standby(1000.0, 3.0, p_sw=0.98)
        self.assertGreater(r_cold, r_single)
        self.assertGreater(r_cold, 0.99)

    def test_05_k_out_of_n_reaction_wheel_pyramid(self):
        """Test 05: Verify 3-out-of-4 reaction wheel pyramid reliability: 4*R^3 - 3*R^4"""
        r_single = 0.95
        r_3_of_4 = calc_r_k_of_n(r_single, 3, 4)
        expected = 4.0 * (0.95 ** 3) - 3.0 * (0.95 ** 4)
        self.assertAlmostEqual(r_3_of_4, expected, places=4)
        self.assertGreater(r_3_of_4, r_single)

    def test_06_spacecraft_system_rbd_product(self):
        """Test 06: Verify system reliability evaluation across all presets"""
        for preset_name in ["falcon9_rideshare_smallsat", "leo_constellation_node", "geo_telecom_flagship"]:
            cfg = MISSION_PRESETS[preset_name]
            res = evaluate_mission_reliability(cfg)
            self.assertGreaterEqual(res["system_reliability"], cfg["target_reliability"])
            self.assertEqual(res["single_point_failures"], 0)

    def test_07_single_point_failure_detection(self):
        """Test 07: Detect single point failures when a critical subsystem is single-string"""
        cfg = {
            "name": "Test Fragile Sat",
            "design_life_years": 3.0,
            "target_reliability": 0.85,
            "subsystems": [
                {"id": "S1", "name": "Single OBC", "subsystem": "OBC", "fit_rate": 800, "redundancy": "SERIES_SINGLE", "severity": 1}
            ]
        }
        res = evaluate_mission_reliability(cfg)
        self.assertEqual(res["single_point_failures"], 1)

    def test_08_mtbf_design_life_margin(self):
        """Test 08: Quantitative MTBF margin >= 3x mission design life"""
        cfg = MISSION_PRESETS["falcon9_rideshare_smallsat"]
        res = evaluate_mission_reliability(cfg)
        self.assertGreaterEqual(res["system_mtbf_years"], cfg["design_life_years"] * 3.0)

    def test_09_2_out_of_3_voting(self):
        """Test 09: Verify 2-out-of-3 majority voting formula: 3*R^2 - 2*R^3"""
        r_single = 0.90
        r_2_of_3 = calc_r_k_of_n(r_single, 2, 3)
        expected = 3.0 * (0.90 ** 2) - 2.0 * (0.90 ** 3)
        self.assertAlmostEqual(r_2_of_3, expected, places=4)

    def test_10_negative_margin_sensitivity(self):
        """Test 10: High failure rate subsystem reduces R(t) below target threshold"""
        cfg = {
            "name": "High Failure Sat",
            "design_life_years": 5.0,
            "target_reliability": 0.90,
            "subsystems": [
                {"id": "S1", "name": "Unreliable Thruster", "subsystem": "Propulsion", "fit_rate": 85000, "redundancy": "SERIES_SINGLE", "severity": 1}
            ]
        }
        res = evaluate_mission_reliability(cfg)
        self.assertLess(res["system_reliability"], cfg["target_reliability"])

if __name__ == "__main__":
    unittest.main()
