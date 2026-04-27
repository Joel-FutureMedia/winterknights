export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface User {
  id: number;
  email: string;
  role: 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_COMPANY';
  enabled: boolean;
  accountApproved: boolean;
  createdAt: string;
}

export interface City {
  id: number;
  name: string;
  corners: Corner[];
  createdAt: string;
}

export interface Corner {
  id: number;
  name: string;
  city?: City;
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED';
  company?: Company;
  companyName?: string;
  companyId?: number;
  price: number;
  createdAt: string;
  cityName?: string;
  cityId?: number;
}

export interface Company {
  id: number;
  companyId: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  user?: User;
  city: City;
  cityId?: number;
  corner: Corner | null;
  paymentStatus: 'NOT_PAID' | 'PAID' | 'PENDING';
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  company?: Company;
  corner: Corner;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  issuedAt: string;
  paidAt: string | null;
}

export interface Payment {
  id: number;
  company?: Company;
  invoice: Invoice;
  fileType: 'PDF' | 'IMAGE';
  originalFileName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  reviewedAt: string | null;
}

export interface BookingRequest {
  id: number;
  company?: Company;
  city: City;
  corner: Corner | null;
  status: 'PENDING' | 'RESERVED' | 'APPROVED' | 'REJECTED';
  message: string | null;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  companyId: string | null;
}

export interface PaymentStatusResponse {
  paymentStatus: string;
  latestPaymentStatus?: string;
}

export interface TotalSpentResponse {
  totalSpent: number;
}

export interface CompanyPaidSummary {
  companyId: number;
  companyName: string;
  companyEmail: string;
  totalPaid: number;
}
