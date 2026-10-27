"""
Crime Risk Classification Service using Machine Learning.
Trains a Random Forest Classifier to categorize spatio-temporal units into:
- Low Risk
- Medium Risk
- High Risk
Includes model training, evaluation metrics, confusion matrix, persistence, and live inference.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

from app.config import settings
from app.utils.logging_config import logger
from app.services.feature_engineering import feature_engineer

RISK_CLASSES = ["Low Risk", "Medium Risk", "High Risk"]

class RiskClassificationModel:
    def __init__(self):
        self.model_path = settings.MODELS_DIR / "risk_classifier.joblib"
        self.encoder_path = settings.MODELS_DIR / "area_encoder.joblib"
        self.metrics_path = settings.MODELS_DIR / "model_metrics.json"
        
        self.classifier = None
        self.area_encoder = None
        self.metrics = None

    def train_and_evaluate(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Executes end-to-end spatio-temporal ML pipeline:
        1. Aggregates data into area-temporal cells.
        2. Splits into train and test sets (80/20).
        3. Computes quantile thresholds on train set only.
        4. Trains Random Forest classifier and baseline model.
        5. Computes multi-class evaluation metrics & confusion matrix.
        6. Persists model and metrics.
        """
        logger.info("Starting Risk Classification Model training...")
        settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Spatio-temporal aggregation
        agg_df = feature_engineer.build_spatio_temporal_aggregations(df)
        if len(agg_df) < 50:
            raise ValueError(f"Insufficient aggregate spatio-temporal units ({len(agg_df)}) for training.")

        # 2. Train/Test split BEFORE computing thresholds to prevent data leakage
        train_df, test_df = train_test_split(
            agg_df, test_size=0.20, random_state=settings.RANDOM_SEED, shuffle=True
        )

        # 3. Learn thresholds strictly on training data
        thresholds = feature_engineer.compute_risk_thresholds(train_df["incident_count"])
        feature_engineer.save_thresholds(thresholds)

        # 4. Generate risk target labels
        train_df = train_df.copy()
        test_df = test_df.copy()
        train_df["risk_label"] = feature_engineer.assign_risk_labels(train_df["incident_count"], thresholds)
        test_df["risk_label"] = feature_engineer.assign_risk_labels(test_df["incident_count"], thresholds)

        # Encode categorical feature: area_name
        area_encoder = LabelEncoder()
        # Fit on all unique areas in original df
        all_areas = sorted(df["area_name"].dropna().unique().tolist())
        area_encoder.fit(all_areas)

        feature_cols = ["area_encoded", "month", "day_of_week_num", "period_code", "is_weekend"]

        train_df["area_encoded"] = area_encoder.transform(train_df["area_name"])
        test_df["area_encoded"] = area_encoder.transform(test_df["area_name"])

        X_train = train_df[feature_cols]
        y_train = train_df["risk_label"]
        X_test = test_df[feature_cols]
        y_test = test_df["risk_label"]

        # 5. Train Random Forest Classifier
        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=settings.RANDOM_SEED,
            class_weight="balanced"
        )
        rf.fit(X_train, y_train)

        # Train Baseline: Logistic Regression
        baseline = LogisticRegression(max_iter=500, random_state=settings.RANDOM_SEED)
        baseline.fit(X_train, y_train)
        baseline_preds = baseline.predict(X_test)
        baseline_accuracy = round(float(accuracy_score(y_test, baseline_preds)), 4)

        # 6. Evaluate Random Forest
        y_pred = rf.predict(X_test)
        
        acc = round(float(accuracy_score(y_test, y_pred)), 4)
        prec_macro = round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4)
        rec_macro = round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4)
        f1_macro = round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4)
        f1_weighted = round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4)

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred, labels=RISK_CLASSES)
        cm_dict = {
            "labels": RISK_CLASSES,
            "matrix": cm.tolist()
        }

        # Feature Importances
        feature_importances = [
            {"feature": col, "importance": round(float(imp), 4)}
            for col, imp in zip(
                ["LAPD Geographic Area", "Month of Year", "Day of Week", "Time of Day Period", "Is Weekend Flag"],
                rf.feature_importances_
            )
        ]
        feature_importances.sort(key=lambda x: x["importance"], reverse=True)

        # Class counts
        train_distribution = train_df["risk_label"].value_counts().to_dict()
        test_distribution = test_df["risk_label"].value_counts().to_dict()

        metrics_payload = {
            "model_type": "Random Forest Classifier",
            "baseline_model": "Multinomial Logistic Regression",
            "baseline_accuracy": baseline_accuracy,
            "accuracy": acc,
            "precision_macro": prec_macro,
            "recall_macro": rec_macro,
            "f1_macro": f1_macro,
            "f1_weighted": f1_weighted,
            "confusion_matrix": cm_dict,
            "feature_importances": feature_importances,
            "thresholds": thresholds,
            "train_samples": len(train_df),
            "test_samples": len(test_df),
            "class_distribution_train": train_distribution,
            "class_distribution_test": test_distribution,
            "supported_areas": all_areas,
            "academic_notes": (
                "Categories represent historical incident frequency quartiles. "
                "This model provides an educational analytical estimation of aggregate crime density, "
                "not an individual behavioral prediction."
            )
        }

        # Save model artifacts
        joblib.dump(rf, self.model_path)
        joblib.dump(area_encoder, self.encoder_path)
        with open(self.metrics_path, "w", encoding="utf-8") as f:
            json.dump(metrics_payload, f, indent=2)

        self.classifier = rf
        self.area_encoder = area_encoder
        self.metrics = metrics_payload

        logger.info(f"Random Forest model trained successfully. Test Accuracy: {acc:.2%}, F1: {f1_macro:.4f}")
        return metrics_payload

    def load_metrics(self) -> Dict[str, Any]:
        """Loads cached model evaluation metrics."""
        if self.metrics is not None:
            return self.metrics
        if self.metrics_path.exists():
            with open(self.metrics_path, "r", encoding="utf-8") as f:
                self.metrics = json.load(f)
            return self.metrics
        raise FileNotFoundError("Model metrics not found. Train the risk classification model first.")

    def predict_risk(
        self,
        area_name: str,
        month: int,
        day_of_week: int,
        time_period_code: int
    ) -> Dict[str, Any]:
        """
        Inference function for predicting crime risk category for an area/time query.
        """
        # Load artifacts if not in memory
        if self.classifier is None or self.area_encoder is None:
            if not self.model_path.exists() or not self.encoder_path.exists():
                raise FileNotFoundError("Trained classifier or encoder artifact missing. Run training first.")
            self.classifier = joblib.load(self.model_path)
            self.area_encoder = joblib.load(self.encoder_path)

        # Validate area
        known_areas = set(self.area_encoder.classes_)
        if area_name not in known_areas:
            # Fallback to closest or first area
            area_name = sorted(list(known_areas))[0]

        area_encoded = int(self.area_encoder.transform([area_name])[0])
        is_weekend = 1 if day_of_week in [5, 6] else 0

        features = pd.DataFrame([{
            "area_encoded": area_encoded,
            "month": month,
            "day_of_week_num": day_of_week,
            "period_code": time_period_code,
            "is_weekend": is_weekend
        }])

        pred_label = self.classifier.predict(features)[0]
        probabilities = self.classifier.predict_proba(features)[0]
        classes = self.classifier.classes_

        prob_dict = {
            cls: round(float(prob), 4) for cls, prob in zip(classes, probabilities)
        }
        confidence = round(float(max(probabilities)) * 100, 1)

        # Day name lookup
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_name = day_names[day_of_week] if 0 <= day_of_week < 7 else "Unknown"

        period_names = ["Night (00:00 - 05:59)", "Morning (06:00 - 11:59)", "Afternoon (12:00 - 17:59)", "Evening (18:00 - 23:59)"]
        period_name = period_names[time_period_code] if 0 <= time_period_code < 4 else "Unknown"

        return {
            "predicted_risk_category": pred_label,
            "confidence_percentage": confidence,
            "class_probabilities": prob_dict,
            "inputs": {
                "area_name": area_name,
                "month": month,
                "day_of_week": day_name,
                "day_of_week_num": day_of_week,
                "time_period": period_name,
                "time_period_code": time_period_code,
                "is_weekend": bool(is_weekend)
            },
            "explanation": f"Based on historical crime records, {area_name} during {period_name} on {day_name}s exhibits {pred_label.lower()} incident frequency.",
            "disclaimer": "This is an analytical and educational classification of historical crime density, not a guarantee or prediction directed at any individual."
        }

risk_model_service = RiskClassificationModel()
