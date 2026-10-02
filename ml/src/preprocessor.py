import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from ml.src.config import CATEGORICAL_FEATURES, NUMERICAL_FEATURES

class FlightPreprocessor:
    """
    Reusable feature preprocessing pipeline wrapping Scikit-Learn ColumnTransformer.
    Ensures standard scaling for numerical features and OneHotEncoding for categoricals,
    with built-in feature name extraction for SHAP and explainability models.
    """
    def __init__(self):
        self.numerical_features = NUMERICAL_FEATURES
        self.categorical_features = CATEGORICAL_FEATURES
        self.pipeline = None
        self.feature_names = None

    def build_pipeline(self) -> ColumnTransformer:
        numerical_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        self.pipeline = ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, self.numerical_features),
                ('cat', categorical_transformer, self.categorical_features)
            ]
        )
        return self.pipeline

    def fit(self, X: pd.DataFrame, y=None):
        if self.pipeline is None:
            self.build_pipeline()
        self.pipeline.fit(X, y)
        self._extract_feature_names()
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if self.pipeline is None:
            raise ValueError("Preprocessor pipeline has not been fitted yet!")
        return self.pipeline.transform(X)

    def fit_transform(self, X: pd.DataFrame, y=None) -> np.ndarray:
        if self.pipeline is None:
            self.build_pipeline()
        transformed = self.pipeline.fit_transform(X, y)
        self._extract_feature_names()
        return transformed

    def _extract_feature_names(self):
        names = []
        # Numerical feature names
        names.extend(self.numerical_features)

        # OneHot feature names
        cat_transformer = self.pipeline.named_transformers_['cat']
        onehot = cat_transformer.named_steps['onehot']
        cat_names = list(onehot.get_feature_names_out(self.categorical_features))
        names.extend(cat_names)
        self.feature_names = names

    def get_feature_names(self) -> list:
        if self.feature_names is None:
            self._extract_feature_names()
        return self.feature_names


def create_preprocessing_pipeline() -> FlightPreprocessor:
    """Factory function returning a fresh FlightPreprocessor instance."""
    preprocessor = FlightPreprocessor()
    preprocessor.build_pipeline()
    return preprocessor
