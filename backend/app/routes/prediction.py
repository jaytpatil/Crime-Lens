"""
Risk Prediction and Model Evaluation Endpoints.
"""

from fastapi import APIRouter, HTTPException
from app.services.risk_model import risk_model_service
from app.utils.validation import RiskPredictionRequest

router = APIRouter(tags=["Prediction"])

@router.get("/model-metrics")
def get_model_evaluation_metrics():
    try:
        metrics = risk_model_service.load_metrics()
        return metrics
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Risk classification model has not been trained yet."
        )

@router.post("/predict-risk")
def predict_crime_risk(request: RiskPredictionRequest):
    try:
        result = risk_model_service.predict_risk(
            area_name=request.area_name,
            month=request.month,
            day_of_week=request.day_of_week,
            time_period_code=request.time_period_code
        )
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
