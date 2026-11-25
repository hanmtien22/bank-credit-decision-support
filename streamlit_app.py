from pathlib import Path

import streamlit as st

from credit_scoring import load_pipeline, review_route, score_application
from sample_profiles import PROFILES

st.set_page_config(page_title="Loan review | Bank Credit Decision Support", layout="centered")

GROUPS = {
    "Loan terms": [
        ("amount", "Loan amount"), ("payments", "Payment per instalment"),
    ],
    "Account": [
        ("account_age_days", "Account age (days)"),
        ("n_disponents", "People authorised on the account"),
    ],
    "Standing orders": [
        ("n_orders", "Number of standing orders"),
        ("total_order_amount", "Total standing order amount"),
    ],
    "Transactions before the loan": [
        ("n_trans_before_loan", "Number of transactions"),
        ("avg_amount_before_loan", "Mean transaction amount"),
        ("avg_balance_before_loan", "Mean balance"),
        ("std_balance_before_loan", "Balance standard deviation"),
        ("min_balance_before_loan", "Minimum balance"),
        ("last_balance_before_loan", "Most recent balance"),
    ],
}
COUNTS = {"account_age_days", "n_disponents", "n_orders", "n_trans_before_loan"}
SIGNED = {"avg_balance_before_loan", "min_balance_before_loan", "last_balance_before_loan"}
EXPLANATIONS = {
    "Auto-approve": "The score is at or below the 30% approval threshold.",
    "Manual review": "The score falls between 30% and 72.48%. A reviewer examines the application.",
    "Recommend rejection": "The score is at or above the 72.48% rejection threshold.",
}


@st.cache_resource
def get_model():
    return load_pipeline()


def load_profile():
    profile = PROFILES[st.session_state.profile]
    for field, value in profile.items():
        st.session_state[field] = int(value) if field in COUNTS else float(value)
    st.session_state.submitted = profile.copy()


st.title("Loan review")
st.write("Explore how loan terms and account history affect an application’s risk score and review route.")
st.selectbox("Synthetic application", list(PROFILES), key="profile", on_change=load_profile)
if "submitted" not in st.session_state:
    load_profile()

result = st.container(border=True)
with st.form("application"):
    st.subheader("Application details")
    for group, fields in GROUPS.items():
        st.markdown(f"**{group}**")
        columns = st.columns(2)
        for index, (field, label) in enumerate(fields):
            minimum = None if field in SIGNED else (0 if field in COUNTS else 0.0)
            columns[index % 2].number_input(
                label, min_value=minimum, step=1 if field in COUNTS else 0.01,
                format="%d" if field in COUNTS else "%.2f", key=field,
            )
    if st.form_submit_button("Score application", type="primary"):
        values = {field: st.session_state[field] for fields in GROUPS.values() for field, _ in fields}
        if values["min_balance_before_loan"] > min(values["avg_balance_before_loan"], values["last_balance_before_loan"]):
            st.error("Minimum balance must be at or below both mean and most recent balance.")
        else:
            st.session_state.submitted = values

model, metadata = get_model()
probability, label = score_application(st.session_state.submitted, model, metadata)
route = review_route(probability)
with result:
    st.caption("CURRENT ASSESSMENT")
    st.subheader(route)
    left, right = st.columns(2)
    left.metric("Estimated risk", f"{probability:.2%}")
    right.metric("Model label", label)
    st.progress(probability)
    st.write(EXPLANATIONS[route])

with st.expander("Model details and evaluation"):
    st.write("XGBoost uses 12 numeric features selected with SHAP. On the held-out set of 137 loans it flagged 10 of 15 bad loans and flagged two good loans in error.")
    st.image(str(Path(__file__).resolve().parent / "docs/figures/shap_summary_xgb_step7.png"),
             caption="Feature contributions across training applications.")
st.caption("Three-person academic project · Synthetic profiles · Amounts use the training dataset’s monetary units.")
