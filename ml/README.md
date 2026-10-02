# Machine Learning Module — FlightSense AI

This module contains data preprocessing routines, model architecture definitions, training scripts, evaluation metrics generators, and SHAP explainability modules.

## 📁 Source Code Structure

- `src/config.py`: ML pipeline hyperparameter constants, column specs, and path variables.
- `src/data_loader.py`: Utilities for loading raw flight CSVs, filtering missing records, and validating feature columns.
- `src/preprocessor.py`: Scikit-learn Pipeline for categorical encoding, missing value imputation, and scaling.
- `src/train.py`: XGBoost training script with train/test splitting, cross-validation, and Joblib model serialization.
- `src/evaluate.py`: Performance evaluator calculating ROC-AUC, PR-AUC, Confusion Matrix, and feature importances.
- `src/explain.py`: SHAP TreeExplainer builder for local feature attribution generation.

## 🚀 Execution

```bash
cd ml
pip install -r requirements.txt
python src/train.py
```
