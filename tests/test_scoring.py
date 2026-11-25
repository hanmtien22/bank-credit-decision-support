import json
from pathlib import Path
import subprocess
import sys

import pytest
from streamlit.testing.v1 import AppTest

from credit_scoring import load_pipeline, review_route, score_application
from sample_profiles import PROFILES

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def pipeline():
    return load_pipeline()


# Captured from the original Python predictor in the team's handover archive.
@pytest.mark.parametrize("profile,probability,label,route", [
    ("Application A", 0.080768086, "Good", "Auto-approve"),
    ("Application B", 0.569542289, "Bad", "Manual review"),
    ("Application C", 0.860826313, "Bad", "Recommend rejection"),
])
def test_original_predictions(profile, probability, label, route, pipeline):
    score, result = score_application(PROFILES[profile], *pipeline)
    assert score == pytest.approx(probability, abs=1e-6)
    assert result == label
    assert review_route(score) == route


def test_team_api_contract():
    run = subprocess.run(
        [sys.executable, str(ROOT / "team-app/server/ml_models/predict.py")],
        input=json.dumps(PROFILES["Application B"]), capture_output=True, text=True, check=True,
    )
    result = json.loads(run.stdout)
    assert result["success"] and result["riskLabel"] == "Bad"
    assert result["riskProbability"] == pytest.approx(0.569542289, abs=1e-6)
    assert result["modelMetrics"]["f1"] == 0.7407


@pytest.mark.parametrize("score,expected", [
    (0, "Auto-approve"), (0.30, "Auto-approve"), (0.300001, "Manual review"),
    (0.724799, "Manual review"), (0.7248, "Recommend rejection"), (1, "Recommend rejection"),
])
def test_policy_boundaries(score, expected):
    assert review_route(score) == expected


def test_missing_feature(pipeline):
    values = PROFILES["Application A"].copy()
    values.pop("amount")
    with pytest.raises(ValueError, match="Missing required feature: amount"):
        score_application(values, *pipeline)


def test_interactive_review():
    app = AppTest.from_file(str(ROOT / "streamlit_app.py"), default_timeout=60).run()
    assert not app.exception
    assert len(app.number_input) == 12
    assert app.metric[0].value == "8.08%"
    app.selectbox[0].select("Application B").run()
    assert app.metric[0].value == "56.95%"
    app.number_input(key="min_balance_before_loan").set_value(999999.0)
    app.button[0].click().run()
    assert app.error and app.metric[0].value == "56.95%"
    app.selectbox[0].select("Application C").run()
    app.button[0].click().run()
    assert not app.exception and not app.error
    assert app.metric[0].value == "86.08%"
