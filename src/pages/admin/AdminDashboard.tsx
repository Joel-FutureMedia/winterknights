import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminApi, citiesApi, cornersApi } from '@/lib/api';
import type { Company, City, Corner, Invoice, Payment, BookingRequest, User } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, MapPin, Users, CreditCard, FileText, LogOut, Shield, Plus, Trash2, Check, X, Download, Eye } from 'lucide-react';
import logo from '@/assets/logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type AdminTab = 'companies' | 'cities' | 'corners' | 'payments' | 'invoices' | 'bookings' | 'admins';

/** Axios blob responses lose a usable MIME when re-wrapped without `type`, so PDFs/images open as plain text. */
function proofBlobMime(
  res: { headers: Record<string, string>; data: Blob },
  fileType: string,
  originalFileName: string
): string {
  const raw = res.headers['content-type'] ?? res.headers['Content-Type'];
  const fromHeader = typeof raw === 'string' ? raw.split(';')[0].trim() : '';
  if (fromHeader && fromHeader !== 'application/octet-stream') return fromHeader;
  if (fileType?.toUpperCase() === 'PDF') return 'application/pdf';
  const n = (originalFileName || '').toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (res.data instanceof Blob && res.data.type) return res.data.type;
  return 'application/octet-stream';
}

const AdminDashboard: React.FC = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [corners, setCorners] = useState<Corner[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<AdminTab>('companies');
  const [search, setSearch] = useState<Record<AdminTab, string>>({
    companies: '',
    cities: '',
    corners: '',
    payments: '',
    invoices: '',
    bookings: '',
    admins: '',
  });

  // Dialogs (Admin "Add/Create")
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [cornerDialogOpen, setCornerDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const [creatingCity, setCreatingCity] = useState(false);
  const [creatingCorner, setCreatingCorner] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Forms
  const [newCity, setNewCity] = useState('');
  const [newCorner, setNewCorner] = useState({ name: '', cityId: '', price: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  const [assignCornerData, setAssignCornerData] = useState({ companyId: 0, cornerId: '' });
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});

  const fetchAll = async () => {
    try {
      const [comp, ci, co, inv, pay, br] = await Promise.all([
        adminApi.getCompanies().catch(() => ({ data: { data: [] } })),
        citiesApi.getAll().catch(() => ({ data: { data: [] } })),
        cornersApi.getAll().catch(() => ({ data: { data: [] } })),
        adminApi.getInvoices().catch(() => ({ data: { data: [] } })),
        adminApi.getPayments().catch(() => ({ data: { data: [] } })),
        adminApi.getBookingRequests().catch(() => ({ data: { data: [] } })),
      ]);
      setCompanies((comp.data as any).data || []);
      setCities((ci.data as any).data || []);
      setCorners((co.data as any).data || []);
      setInvoices((inv.data as any).data || []);
      setPayments((pay.data as any).data || []);
      setBookingRequests((br.data as any).data || []);

      if (isSuperAdmin) {
        try {
          const aRes = await adminApi.getAdmins();
          setAdmins((aRes.data as any).data || []);
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_SUPER_ADMIN')) {
      navigate('/admin');
      return;
    }
    fetchAll();
  }, [user]);

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-700', RESERVED: 'bg-yellow-100 text-yellow-700',
      BOOKED: 'bg-blue-100 text-blue-700', PAID: 'bg-green-100 text-green-700',
      NOT_PAID: 'bg-red-100 text-red-700', PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-muted text-muted-foreground',
    };
    return <Badge variant="secondary" className={`border-0 ${colors[s] || ''}`}>{s}</Badge>;
  };

  // Actions
  const approveCompany = async (id: number, cornerId?: number) => {
    const key = `approve-company-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try {
      await adminApi.approveCompany(id, cornerId);
      toast.success('Company approved');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const rejectCompany = async (id: number) => {
    try {
      await adminApi.rejectCompany(id);
      toast.success('Company rejected');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const unassignCorner = async (id: number) => {
    const key = `unassign-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try {
      await adminApi.unassignCorner(id);
      toast.success('Corner unassigned');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const togglePayment = async (id: number, current: string) => {
    const next = current === 'PAID' ? 'NOT_PAID' : 'PAID';
    const key = `toggle-payment-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try {
      await adminApi.setPaymentStatus(id, next as any);
      toast.success(`Payment set to ${next}`);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const handleAssignCorner = async (companyId: number, cornerId: number) => {
    const key = `assign-corner-${companyId}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try {
      await adminApi.assignCorner(companyId, cornerId);
      toast.success('Corner assigned');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const createCity = async () => {
    const name = newCity.trim();
    if (!name) return;
    setCreatingCity(true);
    try {
      await adminApi.createCity(name);
      toast.success('City created');
      setNewCity('');
      setCityDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setCreatingCity(false);
    }
  };

  const deleteCity = async (id: number) => {
    try {
      await adminApi.deleteCity(id);
      toast.success('City deleted');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const createCorner = async () => {
    const name = newCorner.name.trim();
    const cityId = newCorner.cityId;
    const priceNum = newCorner.price === '' ? NaN : Number(newCorner.price);
    if (!name || !cityId || !Number.isFinite(priceNum)) return;

    setCreatingCorner(true);
    try {
      await adminApi.createCorner({ name, cityId: Number(cityId), price: priceNum });
      toast.success('Corner created');
      setNewCorner({ name: '', cityId: '', price: '' });
      setCornerDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setCreatingCorner(false);
    }
  };

  const deleteCorner = async (id: number) => {
    try {
      await adminApi.deleteCorner(id);
      toast.success('Corner deleted');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const changeCornerStatus = async (id: number, status: 'AVAILABLE' | 'RESERVED' | 'BOOKED') => {
    try {
      await adminApi.updateCornerStatus(id, status);
      toast.success(`Corner set to ${status}`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const approvePayment = async (id: number) => {
    const key = `approve-payment-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try { await adminApi.approvePayment(id); toast.success('Payment approved'); fetchAll(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const rejectPayment = async (id: number) => {
    const key = `reject-payment-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try { await adminApi.rejectPayment(id); toast.success('Payment rejected'); fetchAll(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const downloadProof = async (p: Payment) => {
    try {
      const res = await adminApi.downloadProof(p.id);
      const mime = proofBlobMime(res, p.fileType, p.originalFileName);
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = p.originalFileName?.trim() || `proof-${p.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const viewProof = async (p: Payment) => {
    try {
      const res = await adminApi.downloadProof(p.id);
      const mime = proofBlobMime(res, p.fileType, p.originalFileName);
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch {
      toast.error('Preview failed');
    }
  };

  const downloadInvoice = async (id: number, num: string) => {
    try {
      const res = await adminApi.downloadInvoice(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${num}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const viewInvoice = async (id: number) => {
    try {
      const res = await adminApi.downloadInvoice(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch {
      toast.error('Preview failed');
    }
  };

  const approveBr = async (request: BookingRequest) => {
    const id = request.id;
    const cornerId = request.corner?.id || Number(assignCornerData.cornerId);
    if (!cornerId) {
      toast.error('Select a corner before approving this request.');
      return;
    }
    const key = `approve-br-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try { await adminApi.approveBookingRequest(id, cornerId); toast.success('Booking approved'); fetchAll(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const rejectBr = async (id: number) => {
    const key = `reject-br-${id}`;
    if (actionBusy[key]) return;
    setActionBusy((s) => ({ ...s, [key]: true }));
    try { await adminApi.rejectBookingRequest(id); toast.success('Booking rejected'); fetchAll(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionBusy((s) => ({ ...s, [key]: false })); }
  };

  const createAdmin = async () => {
    const email = newAdmin.email.trim();
    const password = newAdmin.password;
    if (!email || !password) return;

    setCreatingAdmin(true);
    try {
      await adminApi.createAdmin(email, password);
      toast.success('Admin created');
      setNewAdmin({ email: '', password: '' });
      setAdminDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const deleteAdmin = async (id: number) => {
    try { await adminApi.deleteAdmin(id); toast.success('Admin deleted'); fetchAll(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const pendingCompanies = companies.filter(c => !c.user?.accountApproved);
  const availCorners = corners.filter(c => c.status === 'AVAILABLE');
  const pendingInvoicesCount = invoices.filter(i => i.status === 'PENDING').length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'PENDING').length;

  const q = (tab: AdminTab) => search[tab].trim().toLowerCase();
  const filteredCompanies = companies.filter((c) =>
    `${c.companyId} ${c.name} ${c.email} ${c.city?.name || ''} ${c.corner?.name || ''}`.toLowerCase().includes(q('companies'))
  );
  const getCompanyBookingStatus = (companyId: number): 'PENDING' | 'RESERVED' | 'APPROVED' | 'REJECTED' => {
    const latest = bookingRequests
      .filter((br) => br.company?.id === companyId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
    if (latest) return latest.status;
    return 'PENDING';
  };
  const filteredCities = cities.filter((c) =>
    `${c.name}`.toLowerCase().includes(q('cities'))
  );
  const filteredCorners = corners.filter((c) =>
    `${c.name} ${c.cityName || c.city?.name || ''} ${c.status} ${c.companyName || c.company?.name || ''}`.toLowerCase().includes(q('corners'))
  );
  const filteredPayments = payments.filter((p) =>
    `${p.company?.name || ''} ${p.originalFileName || ''} ${p.fileType || ''} ${p.status || ''} ${p.invoice?.invoiceNumber || ''}`.toLowerCase().includes(q('payments'))
  );
  const filteredInvoices = invoices.filter((inv) =>
    `${inv.invoiceNumber} ${inv.company?.name || ''} ${inv.corner?.name || ''} ${inv.corner?.cityName || ''} ${inv.status}`.toLowerCase().includes(q('invoices'))
  );
  const filteredBookings = bookingRequests.filter((br) =>
    `${br.company?.name || ''} ${br.city?.name || ''} ${br.corner?.name || ''} ${br.message || ''} ${br.status}`.toLowerCase().includes(q('bookings'))
  );
  const filteredAdmins = admins.filter((a) =>
    `${a.email} ${a.role}`.toLowerCase().includes(q('admins'))
  );

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full">
        <Sidebar side="left">
          <SidebarContent className="px-2">
            <SidebarHeader>
              <div className="flex items-center gap-3 px-2">
                {/* Preserve original logo aspect ratio */}
                <img src={logo} alt="WK" className="h-16 w-auto object-contain" />
              </div>
            </SidebarHeader>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-base">Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'companies'}
                    onClick={() => setActiveTab('companies')}
                    type="button"
                  >
                    <Building2 size={16} className="text-gold" />
                    <span className="text-base font-semibold">Companies</span>
                    {pendingCompanies.length > 0 && <SidebarMenuBadge>{pendingCompanies.length}</SidebarMenuBadge>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" isActive={activeTab === 'cities'} onClick={() => setActiveTab('cities')} type="button">
                    <MapPin size={16} className="text-gold" />
                    <span className="text-base font-semibold">Cities</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'corners'}
                    onClick={() => setActiveTab('corners')}
                    type="button"
                  >
                    <Shield size={16} className="text-gold" />
                    <span className="text-base font-semibold">Corners</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'payments'}
                    onClick={() => setActiveTab('payments')}
                    type="button"
                  >
                    <CreditCard size={16} className="text-gold" />
                    <span className="text-base font-semibold">Payments</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'invoices'}
                    onClick={() => setActiveTab('invoices')}
                    type="button"
                  >
                    <FileText size={16} className="text-gold" />
                    <span className="text-base font-semibold">Invoices</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'bookings'}
                    onClick={() => setActiveTab('bookings')}
                    type="button"
                  >
                    <Users size={16} className="text-gold" />
                    <span className="text-base font-semibold">Bookings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSuperAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="lg"
                      isActive={activeTab === 'admins'}
                      onClick={() => setActiveTab('admins')}
                      type="button"
                    >
                      <Eye size={16} className="text-gold" />
                      <span className="text-base font-semibold">Admins</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 bg-muted/30">
          <header className="gradient-navy sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
              </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-gold/20 text-gold border-0">{isSuperAdmin ? 'Super Admin' : 'Admin'}</Badge>
            <span className="text-primary-foreground/70 text-base hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:text-gold">
              <LogOut size={16} className="mr-1" /> Logout
            </Button>
          </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <h1 className="font-display text-3xl uppercase text-navy mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Building2 className="text-gold" size={24} />
            <div><p className="text-xs text-muted-foreground uppercase">Companies</p><p className="font-display text-2xl text-navy">{companies.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <MapPin className="text-gold" size={24} />
            <div><p className="text-xs text-muted-foreground uppercase">Cities</p><p className="font-display text-2xl text-navy">{cities.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Shield className="text-gold" size={24} />
            <div><p className="text-xs text-muted-foreground uppercase">Corners</p><p className="font-display text-2xl text-navy">{corners.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <CreditCard className="text-gold" size={24} />
            <div><p className="text-xs text-muted-foreground uppercase">Pending Payments</p><p className="font-display text-2xl text-navy">{pendingPaymentsCount}</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <FileText className="text-gold" size={24} />
            <div><p className="text-xs text-muted-foreground uppercase">Pending Invoices</p><p className="font-display text-2xl text-navy">{pendingInvoicesCount}</p></div>
          </CardContent></Card>
        </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)} className="space-y-6">
          <TabsList className="gradient-navy flex-wrap h-auto gap-1 p-1 md:hidden">
            {['companies', 'cities', 'corners', 'payments', 'invoices', 'bookings', ...(isSuperAdmin ? ['admins'] : [])].map(t => (
              <TabsTrigger key={t} value={t} className="text-primary-foreground data-[state=active]:text-gold data-[state=active]:bg-navy-light capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Companies</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Input
                    placeholder="Search companies..."
                    value={search.companies}
                    onChange={(e) => setSearch((s) => ({ ...s, companies: e.target.value }))}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3">ID</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th>
                      <th className="text-left p-3">City</th><th className="text-left p-3">Corner</th><th className="text-left p-3">Booking Status</th>
                      <th className="text-left p-3">Payment</th><th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredCompanies.map(c => (
                        <tr key={c.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{c.companyId}</td>
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3 text-muted-foreground">{c.email}</td>
                          <td className="p-3">{c.city?.name}</td>
                          <td className="p-3">{c.corner?.name || '—'}</td>
                          <td className="p-3">{statusBadge(getCompanyBookingStatus(c.id))}</td>
                          <td className="p-3">{statusBadge(c.paymentStatus)}</td>
                          <td className="p-3">
                            <div className="flex gap-1 flex-wrap">
                              {!c.user?.accountApproved && c.user?.enabled && (
                                <>
                                  {c.corner ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => approveCompany(c.id)}
                                      disabled={!!actionBusy[`approve-company-${c.id}`]}
                                    >
                                      <Check size={12} className="mr-1" /> {actionBusy[`approve-company-${c.id}`] ? 'Approving...' : 'Approve'}
                                    </Button>
                                  ) : (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-xs">
                                          <Check size={12} className="mr-1" /> Approve
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader><DialogTitle>Assign Corner to Approve</DialogTitle></DialogHeader>
                                        <Select onValueChange={v => setAssignCornerData({ companyId: c.id, cornerId: v })}>
                                          <SelectTrigger><SelectValue placeholder="Select corner" /></SelectTrigger>
                                          <SelectContent>
                                            {availCorners.filter(ac => (ac.city?.id || ac.cityId) === c.city?.id).map(ac => (
                                              <SelectItem key={ac.id} value={String(ac.id)}>{ac.name} — NAD {Number(ac.price).toLocaleString()}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          onClick={() => approveCompany(c.id, Number(assignCornerData.cornerId))}
                                          className="gradient-gold text-primary"
                                          disabled={!!actionBusy[`approve-company-${c.id}`]}
                                        >
                                          {actionBusy[`approve-company-${c.id}`] ? 'Approving...' : 'Approve & Assign'}
                                        </Button>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => rejectCompany(c.id)}>
                                    <X size={12} className="mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {!c.corner && c.user?.accountApproved && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-xs"><Plus size={12} className="mr-1" /> Assign</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Assign Corner</DialogTitle></DialogHeader>
                                    <Select onValueChange={v => setAssignCornerData({ companyId: c.id, cornerId: v })}>
                                      <SelectTrigger><SelectValue placeholder="Select corner" /></SelectTrigger>
                                      <SelectContent>
                                        {availCorners.filter(ac => (ac.city?.id || ac.cityId) === c.city?.id).map(ac => (
                                          <SelectItem key={ac.id} value={String(ac.id)}>{ac.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      onClick={() => handleAssignCorner(c.id, Number(assignCornerData.cornerId))}
                                      className="gradient-gold text-primary"
                                      disabled={!!actionBusy[`assign-corner-${c.id}`]}
                                    >
                                      {actionBusy[`assign-corner-${c.id}`] ? 'Assigning...' : 'Assign'}
                                    </Button>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {c.corner && c.corner.status === 'RESERVED' && (
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => unassignCorner(c.id)}>
                                  <Trash2 size={12} className="mr-1" /> Unassign
                                </Button>
                              )}
                              {c.corner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => togglePayment(c.id, c.paymentStatus)}
                                  disabled={!!actionBusy[`toggle-payment-${c.id}`]}
                                >
                                  <CreditCard size={12} className="mr-1" />
                                  {actionBusy[`toggle-payment-${c.id}`]
                                    ? 'Updating...'
                                    : (c.paymentStatus === 'PAID' ? 'Set Unpaid' : 'Set Paid')}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cities Tab */}
          <TabsContent value="cities">
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Cities</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Add a new city</p>
                  <Dialog
                    open={cityDialogOpen}
                    onOpenChange={(open) => {
                      setCityDialogOpen(open);
                      if (!open) setNewCity('');
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gradient-gold text-primary" type="button">
                        <Plus size={16} className="mr-1" /> Add City
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add City</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>City name</Label>
                        <Input
                          placeholder="e.g. Windhoek"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setCityDialogOpen(false)}
                          disabled={creatingCity}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createCity}
                          className="gradient-gold text-primary"
                          type="button"
                          disabled={!newCity.trim() || creatingCity}
                        >
                          {creatingCity ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="overflow-x-auto">
                  <Input
                    className="mb-3"
                    placeholder="Search cities..."
                    value={search.cities}
                    onChange={(e) => setSearch((s) => ({ ...s, cities: e.target.value }))}
                  />
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Name</th><th className="text-left p-3">Corners</th><th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredCities.map(c => (
                        <tr key={c.id} className="border-b">
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3">{c.corners?.length || 0}</td>
                          <td className="p-3">
                            <Button size="sm" variant="destructive" className="text-xs" onClick={() => deleteCity(c.id)}>
                              <Trash2 size={12} className="mr-1" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Corners Tab */}
          <TabsContent value="corners">
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Corners</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Add a new corner</p>
                  <Dialog
                    open={cornerDialogOpen}
                    onOpenChange={(open) => {
                      setCornerDialogOpen(open);
                      if (!open) setNewCorner({ name: '', cityId: '', price: '' });
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gradient-gold text-primary" type="button">
                        <Plus size={16} className="mr-1" /> Add Corner
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Corner</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Corner name</Label>
                          <Input
                            placeholder="e.g. Corner 12"
                            value={newCorner.name}
                            onChange={(e) => setNewCorner((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Select value={newCorner.cityId} onValueChange={(v) => setNewCorner((f) => ({ ...f, cityId: v }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Price (NAD)</Label>
                          <Input
                            placeholder="e.g. 125000"
                            type="number"
                            value={newCorner.price}
                            onChange={(e) => setNewCorner((f) => ({ ...f, price: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setCornerDialogOpen(false)}
                          disabled={creatingCorner}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createCorner}
                          className="gradient-gold text-primary"
                          type="button"
                          disabled={
                            creatingCorner ||
                            !newCorner.name.trim() ||
                            !newCorner.cityId ||
                            newCorner.price === '' ||
                            !Number.isFinite(Number(newCorner.price))
                          }
                        >
                          {creatingCorner ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="overflow-x-auto">
                  <Input
                    className="mb-3"
                    placeholder="Search corners..."
                    value={search.corners}
                    onChange={(e) => setSearch((s) => ({ ...s, corners: e.target.value }))}
                  />
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Name</th><th className="text-left p-3">City</th><th className="text-left p-3">Price</th>
                      <th className="text-left p-3">Status</th><th className="text-left p-3">Company</th><th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredCorners.map(c => (
                        <tr key={c.id} className="border-b">
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3">{c.cityName || c.city?.name}</td>
                          <td className="p-3 font-display text-gold">NAD {Number(c.price).toLocaleString()}</td>
                          <td className="p-3">{statusBadge(c.status)}</td>
                          <td className="p-3">{c.companyName || c.company?.name || '—'}</td>
                          <td className="p-3">
                            <div className="flex gap-2 flex-wrap">
                              <Select value={c.status} onValueChange={(v) => changeCornerStatus(c.id, v as 'AVAILABLE' | 'RESERVED' | 'BOOKED')}>
                                <SelectTrigger className="h-8 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                                  <SelectItem value="RESERVED">RESERVED</SelectItem>
                                  <SelectItem value="BOOKED">BOOKED</SelectItem>
                                </SelectContent>
                              </Select>
                              {c.status === 'AVAILABLE' && (
                                <Button size="sm" variant="destructive" className="text-xs" onClick={() => deleteCorner(c.id)}>
                                  <Trash2 size={12} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Payments</CardTitle></CardHeader>
              <CardContent>
                <Input
                  className="mb-3"
                  placeholder="Search payments..."
                  value={search.payments}
                  onChange={(e) => setSearch((s) => ({ ...s, payments: e.target.value }))}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Company</th><th className="text-left p-3">File</th><th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Status</th><th className="text-left p-3">Uploaded</th><th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="border-b">
                          <td className="p-3">{p.company?.name || '—'}</td>
                          <td className="p-3 text-xs">{p.originalFileName}</td>
                          <td className="p-3">{p.fileType}</td>
                          <td className="p-3">{statusBadge(p.status)}</td>
                          <td className="p-3">{new Date(p.uploadedAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => viewProof(p)}>
                                <Eye size={12} />
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => downloadProof(p)}>
                                <Download size={12} />
                              </Button>
                              {p.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs text-green-600"
                                    onClick={() => approvePayment(p.id)}
                                    disabled={!!actionBusy[`approve-payment-${p.id}`]}
                                  >
                                    <Check size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="text-xs"
                                    onClick={() => rejectPayment(p.id)}
                                    disabled={!!actionBusy[`reject-payment-${p.id}`]}
                                  >
                                    <X size={12} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Invoices</CardTitle></CardHeader>
              <CardContent>
                <Input
                  className="mb-3"
                  placeholder="Search invoices..."
                  value={search.invoices}
                  onChange={(e) => setSearch((s) => ({ ...s, invoices: e.target.value }))}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Invoice #</th><th className="text-left p-3">Company</th><th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th><th className="text-left p-3">Issued</th><th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className="border-b">
                          <td className="p-3 font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="p-3">{inv.company?.name || '—'}</td>
                          <td className="p-3 font-display text-gold">NAD {Number(inv.amount).toLocaleString()}</td>
                          <td className="p-3">{statusBadge(inv.status)}</td>
                          <td className="p-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => viewInvoice(inv.id)}>
                                <Eye size={12} className="mr-1" /> View
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => downloadInvoice(inv.id, inv.invoiceNumber)}>
                                <Download size={12} className="mr-1" /> PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Requests Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Booking Requests</CardTitle></CardHeader>
              <CardContent>
                <Input
                  className="mb-3"
                  placeholder="Search booking requests..."
                  value={search.bookings}
                  onChange={(e) => setSearch((s) => ({ ...s, bookings: e.target.value }))}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Company</th><th className="text-left p-3">City</th><th className="text-left p-3">Preferred Corner</th>
                      <th className="text-left p-3">Message</th><th className="text-left p-3">Status</th><th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredBookings.map(br => (
                        <tr key={br.id} className="border-b">
                          <td className="p-3">{br.company?.name || '—'}</td>
                          <td className="p-3">{br.city?.name}</td>
                          <td className="p-3">{br.corner?.name || '—'}</td>
                          <td className="p-3 text-xs max-w-[200px] truncate">{br.message || '—'}</td>
                          <td className="p-3">{statusBadge(br.status)}</td>
                          <td className="p-3">
                            {(br.status === 'PENDING' || br.status === 'RESERVED') && (
                              <div className="flex gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-xs text-green-600"><Check size={12} /></Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Confirm Approval</DialogTitle></DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                      Are you sure you want to approve this booking request?
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {br.corner?.id
                                        ? `Corner will be auto-used from the request: ${br.corner?.name}`
                                        : 'This request has no preferred corner. Select one below to approve.'}
                                    </p>
                                    {!br.corner?.id && (
                                      <Select onValueChange={v => setAssignCornerData({ companyId: br.company?.id || 0, cornerId: v })}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select corner in company city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availCorners
                                            .filter(ac => (ac.city?.id || ac.cityId) === br.city?.id)
                                            .map(ac => (
                                              <SelectItem key={ac.id} value={String(ac.id)}>
                                                {ac.name} — NAD {Number(ac.price).toLocaleString()}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    <Button
                                      onClick={() => approveBr(br)}
                                      className="gradient-gold text-primary"
                                      disabled={(!br.corner?.id && !assignCornerData.cornerId) || !!actionBusy[`approve-br-${br.id}`]}
                                    >
                                      {actionBusy[`approve-br-${br.id}`] ? 'Approving...' : 'Approve'}
                                    </Button>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs"
                                  onClick={() => rejectBr(br.id)}
                                  disabled={!!actionBusy[`reject-br-${br.id}`]}
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab (Super Admin only) */}
          {isSuperAdmin && (
            <TabsContent value="admins">
              <Card>
                <CardHeader><CardTitle className="font-display text-xl text-navy">Admin Users</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-end gap-3">
                    <Dialog
                      open={adminDialogOpen}
                      onOpenChange={(open) => {
                        setAdminDialogOpen(open);
                        if (!open) setNewAdmin({ email: '', password: '' });
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button className="gradient-gold text-primary" type="button">
                          <Plus size={16} className="mr-1" /> Create Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Admin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              placeholder="admin@example.com"
                              value={newAdmin.email}
                              onChange={(e) => setNewAdmin((f) => ({ ...f, email: e.target.value }))}
                              className="max-w-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              value={newAdmin.password}
                              onChange={(e) => setNewAdmin((f) => ({ ...f, password: e.target.value }))}
                              className="max-w-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => setAdminDialogOpen(false)}
                            disabled={creatingAdmin}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={createAdmin}
                            className="gradient-gold text-primary"
                            type="button"
                            disabled={!newAdmin.email.trim() || !newAdmin.password || creatingAdmin}
                          >
                            {creatingAdmin ? 'Creating...' : 'Create'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="overflow-x-auto">
                    <Input
                      className="mb-3"
                      placeholder="Search admins..."
                      value={search.admins}
                      onChange={(e) => setSearch((s) => ({ ...s, admins: e.target.value }))}
                    />
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-left p-3">Actions</th>
                      </tr></thead>
                      <tbody>
                        {filteredAdmins.map(a => (
                          <tr key={a.id} className="border-b">
                            <td className="p-3">{a.email}</td>
                            <td className="p-3">{statusBadge(a.role.replace('ROLE_', ''))}</td>
                            <td className="p-3">
                              {a.role !== 'ROLE_SUPER_ADMIN' && (
                                <Button size="sm" variant="destructive" className="text-xs" onClick={() => deleteAdmin(a.id)}>
                                  <Trash2 size={12} />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
