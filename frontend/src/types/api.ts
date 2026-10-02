export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database: string;
  ml_model_status: string;
  timestamp: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface FlightPredictionRequest {
  flight_number: string;
  carrier: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  distance_miles: number;
}

export interface SHAPFeatureAttribution {
  feature: string;
  shap_value: number;
  impact: string;
  feature_value?: string;
}

export interface FlightPredictionResponse {
  prediction_id: string;
  flight_number: string;
  carrier: string;
  origin: string;
  destination: string;
  delay_probability: number;
  predicted_class: 'DELAYED' | 'ON TIME';
  risk_level: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Severe Risk';
  predicted_delay_minutes?: number;
  is_delayed: boolean;
  is_mock_data: boolean;
  shap_summary: SHAPFeatureAttribution[];
  created_at: string;
}

export interface WhatIfSimulationRequest extends FlightPredictionRequest {
  simulated_carrier?: string;
  simulated_origin?: string;
  simulated_destination?: string;
  simulated_scheduled_departure?: string;
  simulated_distance_miles?: number;
}

export interface WhatIfSimulationResponse {
  baseline: FlightPredictionResponse;
  simulated: FlightPredictionResponse;
  comparison: {
    probability_delta: number;
    class_changed: boolean;
    risk_shifted: boolean;
    summary: string;
  };
  is_mock_data: boolean;
}

export interface RouteIntelItem {
  route_id: string;
  origin: string;
  destination: string;
  total_flights: number;
  avg_delay_minutes: number;
  delay_risk_score: number;
  on_time_percentage: number;
  bottleneck_rank: number;
}

export interface RouteIntelligenceResponse {
  routes: RouteIntelItem[];
  top_bottlenecks: RouteIntelItem[];
  is_mock_data: boolean;
}

export interface AirportIntelItem {
  code: string;
  name: string;
  city: string;
  avg_dep_delay: number;
  avg_arr_delay: number;
  congestion_score: number;
  weather_impact_level: string;
}

export interface AirportIntelligenceResponse {
  airports: AirportIntelItem[];
  is_mock_data: boolean;
}

export interface AirlineIntelItem {
  code: string;
  name: string;
  on_time_performance: number;
  avg_delay_minutes: number;
  carrier_delay_share: number;
  fleet_reliability_rating: string;
}

export interface AirlineIntelligenceResponse {
  airlines: AirlineIntelItem[];
  is_mock_data: boolean;
}

export interface MonthlyTrend {
  month: string;
  total_flights: number;
  delayed_flights: number;
  avg_delay_minutes: number;
  delay_rate: number;
}

export interface HourlyDistribution {
  hour: number;
  flight_count: number;
  delay_probability: number;
}

export interface CauseBreakdown {
  cause: string;
  percentage: number;
  avg_minutes: number;
}

export interface AnalyticsOverviewResponse {
  total_flights_analyzed: number;
  overall_delay_rate: number;
  avg_delay_minutes: number;
  top_delay_reason: string;
  monthly_trends: MonthlyTrend[];
  hourly_distribution: HourlyDistribution[];
  cause_breakdown: CauseBreakdown[];
  is_mock_data: boolean;
}

export interface CandidateModelDetail {
  model_name: string;
  decision_threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ precision: number; recall: number }>;
  feature_importances: Array<{ feature: string; importance: number }>;
}

export interface ModelPerformanceMetrics {
  model_version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc?: number;
  selected_decision_threshold?: number;
  production_model_name?: string;
  mae_minutes: number;
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  feature_importances: Array<{ feature: string; importance: number }>;
  candidate_models_comparison?: Record<string, CandidateModelDetail>;
  is_mock_data: boolean;
}

export interface PredictionHistoryItem {
  prediction_id: string;
  flight_number: string;
  carrier: string;
  origin: string;
  destination: string;
  delay_probability: number;
  predicted_class?: string;
  risk_level: string;
  predicted_delay_minutes?: number;
  is_delayed: boolean;
  created_at: string;
  is_mock_data: boolean;
}

export interface SHAPExplanationDetail {
  prediction_id: string;
  flight_number: string;
  carrier: string;
  origin: string;
  destination: string;
  delay_probability: number;
  predicted_class?: string;
  risk_level: string;
  predicted_delay_minutes?: number;
  is_delayed: boolean;
  shap_summary: SHAPFeatureAttribution[];
  created_at: string;
}

