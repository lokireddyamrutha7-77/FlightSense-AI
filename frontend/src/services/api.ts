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
  RequestOTPResponse,
  VerifySignupOTPRequest,
  CustomerProfileResponse,
  UpdateProfileRequest,
  SavedFlightCreate,
  SavedFlightResponse,
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

  requestSignupOTP: async (target: string, targetType: 'email' | 'phone', purpose: string = 'signup'): Promise<RequestOTPResponse> => {
    const res = await apiClient.post<RequestOTPResponse>('/auth/signup/request-otp', {
      target,
      target_type: targetType,
      purpose,
    });
    return res.data;
  },

  verifySignupOTP: async (req: VerifySignupOTPRequest): Promise<AuthTokenResponse> => {
    const res = await apiClient.post<AuthTokenResponse>('/auth/signup/verify-otp', req);
    return res.data;
  },

  login: async (identifier: string, password: string): Promise<AuthTokenResponse> => {
    const res = await apiClient.post<AuthTokenResponse>('/auth/login', { identifier, password });
    return res.data;
  },

  forgotPassword: async (target: string, targetType: 'email' | 'phone'): Promise<RequestOTPResponse> => {
    const res = await apiClient.post<RequestOTPResponse>('/auth/forgot-password', {
      target,
      target_type: targetType,
    });
    return res.data;
  },

  resetPassword: async (target: string, otpCode: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/auth/reset-password', {
      target,
      otp_code: otpCode,
      new_password: newPassword,
    });
    return res.data;
  },

  getProfile: async (): Promise<UserResponse> => {
    const res = await apiClient.get<UserResponse>('/auth/me');
    return res.data;
  },

  getCustomerProfile: async (): Promise<CustomerProfileResponse> => {
    const res = await apiClient.get<CustomerProfileResponse>('/profile');
    return res.data;
  },

  updateCustomerProfile: async (req: UpdateProfileRequest): Promise<CustomerProfileResponse> => {
    const res = await apiClient.put<CustomerProfileResponse>('/profile', req);
    return res.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/profile/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  getSavedFlights: async (): Promise<SavedFlightResponse[]> => {
    const res = await apiClient.get<SavedFlightResponse[]>('/saved-flights');
    return res.data;
  },

  saveFlight: async (req: SavedFlightCreate): Promise<SavedFlightResponse> => {
    const res = await apiClient.post<SavedFlightResponse>('/saved-flights', req);
    return res.data;
  },

  deleteSavedFlight: async (flightId: number): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/saved-flights/${flightId}`);
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

  getPredictionHistory: async (params?: { carrier?: string; risk_level?: string; flight_number?: string; mine_only?: boolean }): Promise<PredictionHistoryItem[]> => {
    const res = await apiClient.get<PredictionHistoryItem[]>('/history', { params });
    return res.data;
  },

  getExplainabilityDetail: async (predictionId: string): Promise<SHAPExplanationDetail> => {
    const res = await apiClient.get<SHAPExplanationDetail>(`/explain/${predictionId}`);
    return res.data;
  },
};


