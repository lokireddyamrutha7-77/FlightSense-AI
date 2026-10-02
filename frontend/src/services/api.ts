import axios from 'axios';
import type {
  HealthResponse,
  FlightPredictionRequest,
  FlightPredictionResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
  RouteIntelligenceResponse,
  AirportIntelligenceResponse,
  AirlineIntelligenceResponse,
  AnalyticsOverviewResponse,
  ModelPerformanceMetrics,
  PredictionHistoryItem,
  SHAPExplanationDetail,
  AuthTokenResponse,
  UserResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('flightsense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  checkHealth: async (): Promise<HealthResponse> => {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  },

  register: async (email: string, password: string, fullName?: string): Promise<AuthTokenResponse> => {
    const res = await apiClient.post<AuthTokenResponse>('/auth/register', { email, password, full_name: fullName });
    return res.data;
  },

  login: async (email: string, password: string): Promise<AuthTokenResponse> => {
    const res = await apiClient.post<AuthTokenResponse>('/auth/login', { email, password });
    return res.data;
  },

  getProfile: async (): Promise<UserResponse> => {
    const res = await apiClient.get<UserResponse>('/auth/me');
    return res.data;
  },

  predictDelay: async (req: FlightPredictionRequest): Promise<FlightPredictionResponse> => {
    const res = await apiClient.post<FlightPredictionResponse>('/predict', req);
    return res.data;
  },

  simulateWhatIf: async (req: WhatIfSimulationRequest): Promise<WhatIfSimulationResponse> => {
    const res = await apiClient.post<WhatIfSimulationResponse>('/predict/what-if', req);
    return res.data;
  },

  getRouteIntelligence: async (): Promise<RouteIntelligenceResponse> => {
    const res = await apiClient.get<RouteIntelligenceResponse>('/routes/intelligence');
    return res.data;
  },

  getAirportIntelligence: async (): Promise<AirportIntelligenceResponse> => {
    const res = await apiClient.get<AirportIntelligenceResponse>('/airports/intelligence');
    return res.data;
  },

  getAirlineIntelligence: async (): Promise<AirlineIntelligenceResponse> => {
    const res = await apiClient.get<AirlineIntelligenceResponse>('/airlines/intelligence');
    return res.data;
  },

  getAnalyticsOverview: async (): Promise<AnalyticsOverviewResponse> => {
    const res = await apiClient.get<AnalyticsOverviewResponse>('/analytics/overview');
    return res.data;
  },

  getModelPerformance: async (): Promise<ModelPerformanceMetrics> => {
    const res = await apiClient.get<ModelPerformanceMetrics>('/model/performance');
    return res.data;
  },

  getPredictionHistory: async (params?: { carrier?: string; risk_level?: string; flight_number?: string }): Promise<PredictionHistoryItem[]> => {
    const res = await apiClient.get<PredictionHistoryItem[]>('/history', { params });
    return res.data;
  },

  getExplainabilityDetail: async (predictionId: string): Promise<SHAPExplanationDetail> => {
    const res = await apiClient.get<SHAPExplanationDetail>(`/explain/${predictionId}`);
    return res.data;
  },
};

