import axios from 'axios';
import type { ApiResponse, City, Corner, Company, Invoice, Payment, BookingRequest, LoginResponse, PaymentStatusResponse, TotalSpentResponse, CompanyPaidSummary, User } from '@/types';

// Default to your local backend port. Override with `VITE_API_URL` when needed.
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.simplyfound.ggff.net/api';
//const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8983/api';


const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/companies')) {
        localStorage.removeItem('wk_token');
        localStorage.removeItem('wk_user');
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: any) => api.post<ApiResponse>('/auth/register', data),
  login: (email: string, password: string) => api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),
  verifyEmail: (token: string) => api.get<ApiResponse>(`/auth/verify-email?token=${token}`),
  forgotPassword: (email: string) => api.post<ApiResponse>('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post<ApiResponse>('/auth/reset-password', { token, newPassword }),
  resendVerification: (email: string) => api.post<ApiResponse>('/auth/resend-verification', { email }),
};

// Public
export const citiesApi = {
  getAll: () => api.get<ApiResponse<City[]>>('/cities/'),
  getById: (id: number) => api.get<ApiResponse<City>>(`/cities/${id}`),
};

export const cornersApi = {
  getAll: () => api.get<ApiResponse<Corner[]>>('/corners/'),
  getByCity: (cityId: number, status?: string) =>
    api.get<ApiResponse<Corner[]>>(`/corners/city/${cityId}${status ? `?status=${status}` : ''}`),
  getById: (id: number) => api.get<ApiResponse<Corner>>(`/corners/${id}`),
};

// Company self-service
export const companyApi = {
  getProfile: () => api.get<ApiResponse<Company>>('/companies/me'),
  updateProfile: (data: Partial<Company>) => api.put<ApiResponse<Company>>('/companies/me', data),
  getCorner: () => api.get<ApiResponse<Corner>>('/companies/me/corner'),
  getInvoice: () => api.get<ApiResponse<Invoice>>('/companies/me/invoice'),
  listInvoices: () => api.get<ApiResponse<Invoice[]>>('/companies/me/invoices'),
  downloadInvoice: () => api.get('/companies/me/invoice/download', { responseType: 'blob' }),
  downloadInvoiceById: (id: number) =>
    api.get(`/companies/me/invoices/${id}/download`, { responseType: 'blob' }),
  uploadPayment: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<ApiResponse>('/companies/me/payment/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPaymentStatus: () => api.get<ApiResponse<PaymentStatusResponse>>('/companies/me/payment/status'),
  listPayments: () => api.get<ApiResponse<Payment[]>>('/companies/me/payments'),
  getTotalSpent: () => api.get<ApiResponse<TotalSpentResponse>>('/companies/me/payments/total-spent'),
  submitBookingRequest: (data: { cityId: number; cornerId?: number; message?: string }) =>
    api.post<ApiResponse>('/companies/booking-request', data),
  updateBookingRequest: (id: number, data: { cityId: number; cornerId?: number; message?: string }) =>
    api.put<ApiResponse>(`/companies/booking-requests/${id}`, data),
  getBookingRequests: () => api.get<ApiResponse<BookingRequest[]>>('/companies/booking-requests'),
  unassignMyCorner: () => api.delete<ApiResponse>('/companies/me/corner'),
};

// Admin
export const adminApi = {
  // Companies
  getCompanies: () => api.get<ApiResponse<Company[]>>('/admin/companies'),
  getCompany: (id: number) => api.get<ApiResponse<Company>>(`/admin/companies/${id}`),
  createCompanyManual: (data: {
    name: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    cityId: number;
    password: string;
  }) => api.post<ApiResponse<Company>>('/admin/companies/manual', data),
  updateCompanyManual: (id: number, data: {
    name?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    cityId?: number;
    password?: string;
  }) => api.put<ApiResponse<Company>>(`/admin/companies/${id}`, data),
  approveCompany: (id: number, cornerId?: number) =>
    api.put<ApiResponse>(`/admin/companies/${id}/approve`, cornerId ? { cornerId } : {}),
  rejectCompany: (id: number) => api.put<ApiResponse>(`/admin/companies/${id}/reject`),
  assignCorner: (companyId: number, cornerId: number) =>
    api.post<ApiResponse>(`/admin/companies/${companyId}/assign-corner/${cornerId}`),
  unassignCorner: (id: number) => api.delete<ApiResponse>(`/admin/companies/${id}/unassign-corner`),
  setPaymentStatus: (id: number, status: 'PAID' | 'NOT_PAID') =>
    api.put<ApiResponse>(`/admin/companies/${id}/payment-status`, { status }),

  // Admins (super admin)
  getAdmins: () => api.get<ApiResponse<User[]>>('/admin/admins'),
  createAdmin: (email: string, password: string) => api.post<ApiResponse>('/admin/admins', { email, password }),
  updateAdmin: (id: number, data: { email?: string; password?: string }) =>
    api.put<ApiResponse>(`/admin/admins/${id}`, data),
  deleteAdmin: (id: number) => api.delete<ApiResponse>(`/admin/admins/${id}`),

  // Booking Requests
  getBookingRequests: () => api.get<ApiResponse<BookingRequest[]>>('/admin/booking-requests'),
  getBookingRequest: (id: number) => api.get<ApiResponse<BookingRequest>>(`/admin/booking-requests/${id}`),
  approveBookingRequest: (id: number, cornerId: number) =>
    api.post<ApiResponse>(`/admin/booking-requests/${id}/approve`, { cornerId }),
  rejectBookingRequest: (id: number) => api.post<ApiResponse>(`/admin/booking-requests/${id}/reject`),

  // Payments
  getPayments: () => api.get<ApiResponse<Payment[]>>('/admin/payments'),
  getCompanyPaidSummary: () => api.get<ApiResponse<CompanyPaidSummary[]>>('/admin/payments/company-paid-summary'),
  getTotalPaidSummary: () => api.get<ApiResponse<{ totalPaid: number }>>('/admin/payments/total-paid'),
  getPayment: (id: number) => api.get<ApiResponse<Payment>>(`/admin/payments/${id}`),
  approvePayment: (id: number) => api.post<ApiResponse>(`/admin/payments/${id}/approve`),
  rejectPayment: (id: number) => api.post<ApiResponse>(`/admin/payments/${id}/reject`),
  downloadProof: (id: number) => api.get(`/admin/payments/${id}/file`, { responseType: 'blob' }),

  // Invoices
  getInvoices: () => api.get<ApiResponse<Invoice[]>>('/admin/invoices'),
  getInvoice: (id: number) => api.get<ApiResponse<Invoice>>(`/admin/invoices/${id}`),
  downloadInvoice: (id: number) => api.get(`/admin/invoices/${id}/download`, { responseType: 'blob' }),

  // Cities (admin)
  createCity: (name: string) => api.post<ApiResponse<City>>('/cities/', { name }),
  updateCity: (id: number, name: string) => api.put<ApiResponse<City>>(`/cities/${id}`, { name }),
  deleteCity: (id: number) => api.delete<ApiResponse>(`/cities/${id}`),

  // Corners (admin)
  createCorner: (data: { name: string; cityId: number; price: number }) =>
    api.post<ApiResponse<Corner>>('/corners/', data),
  updateCorner: (id: number, data: { name?: string; price?: number }) =>
    api.put<ApiResponse<Corner>>(`/corners/${id}`, data),
  updateCornerStatus: (id: number, status: 'AVAILABLE' | 'RESERVED' | 'BOOKED') =>
    api.put<ApiResponse<Corner>>(`/corners/${id}/status`, { status }),
  deleteCorner: (id: number) => api.delete<ApiResponse>(`/corners/${id}`),
};

export default api;
