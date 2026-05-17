
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

app = FastAPI(title="FinTech ML Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "ml-services"}

class Tx(BaseModel):
    id: int
    type: str
    amount: float
    date: str
    category: str
    description: Optional[str] = ""

class BudgetItem(BaseModel):
    category: str
    limit: float
    period: str

class AnalyzeRequest(BaseModel):
    transactions: List[Tx]
    budgets: List[BudgetItem]

def categorize_keyword(desc: str) -> str:
    d = (desc or "").lower()
    if any(k in d for k in ["salary", "payroll", "credit"]):
        return "Salary"
    if any(k in d for k in ["rent", "lease"]):
        return "Rent"
    if any(k in d for k in ["grocery", "supermarket", "food"]):
        return "Groceries"
    if any(k in d for k in ["electric", "water", "gas", "bill", "utility"]):
        return "Utilities"
    if any(k in d for k in ["uber", "ola", "metro", "bus", "taxi", "fuel"]):
        return "Transport"
    if any(k in d for k in ["interest", "fd", "rd"]):
        return "Interest"
    return "Misc"

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/categorize")
def categorize(payload: List[str]):
    return [{"description": p, "category": categorize_keyword(p)} for p in payload]

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    df = pd.DataFrame([t.dict() for t in req.transactions])
    if df.empty:
        return {
            "categorizedExpenses": [],
            "forecast": [],
            "anomalies": [],
            "explanations": ["No transactions provided."]
        }
    df["date"] = pd.to_datetime(df["date"])
    expenses = df[df["type"] == "expense"]
    income = df[df["type"] == "income"]

    cat_breakdown = expenses.groupby("category")["amount"].sum().reset_index()
    categorizedExpenses = [{"category": row["category"], "amount": float(row["amount"])} for _, row in cat_breakdown.iterrows()]

    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly_exp = expenses.groupby("month")["amount"].sum().reset_index()
    monthly_inc = income.groupby("month")["amount"].sum().reset_index()

    def proj(series_vals):
        if len(series_vals) == 0:
            return 0.0
        tail = series_vals[-3:] if len(series_vals) >= 3 else series_vals
        return float(np.mean(tail)) * 1.03

    months = sorted(set(df["month"].tolist()))
    last_month = months[-1]
    forecast = []
    for i in range(1, 4):
        forecast.append({
            "month": pd.Period(last_month).to_timestamp() + pd.DateOffset(months=i),
            "projectedExpenses": proj(monthly_exp["amount"].tolist()),
            "projectedIncome": proj(monthly_inc["amount"].tolist())
        })
    for f in forecast:
        if hasattr(f["month"], "strftime"):
            f["month"] = f["month"].strftime("%Y-%m")

    anomalies = []
    try:
        X = expenses[["amount"]].values
        if len(X) >= 10:
            iso = IsolationForest(contamination=0.12, random_state=42)
            iso.fit(X)
            y_pred = iso.predict(X)
            for idx, pred in enumerate(y_pred):
                if pred == -1:
                    row = expenses.iloc[idx]
                    anomalies.append({
                        "id": int(row["id"]),
                        "date": row["date"].strftime("%Y-%m-%d"),
                        "amount": float(row["amount"]),
                        "category": str(row["category"]),
                        "reason": "Unusual spend detected by Isolation Forest"
                    })
    except Exception:
        pass

    total_income = float(income["amount"].sum()) if not income.empty else 0.0
    total_expense = float(expenses["amount"].sum()) if not expenses.empty else 0.0
    savings_ratio = (total_income - total_expense) / max(total_income, 1.0)
    health = max(30.0, min(95.0, 60.0 + 40.0 * savings_ratio))

    explanations = [
        f"Projected expenses based on recent trend. Income and expenses averaged over last months.",
        f"Financial health score computed from savings ratio: {health:.1f}/100."
    ]

    return {
        "categorizedExpenses": categorizedExpenses,
        "forecast": forecast,
        "anomalies": anomalies,
        "explanations": explanations
    }
