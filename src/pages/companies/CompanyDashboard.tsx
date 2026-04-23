import React, { useEffect, useState } from 'react';
import { companyApi } from '@/lib/api';
import type { Company, Corner, Invoice, BookingRequest, PaymentStatusResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MapPin, CreditCard, FileText, Upload, LogOut, User, Send, Eye } from 'lucide-react';
import { citiesApi, cornersApi } from '@/lib/api';
import type { City } from '@/types';
import logo from '@/assets/logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const CompanyDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Company | null>(null);
  const [corner, setCorner] = useState<Corner | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoicesHistory, setInvoicesHistory] = useState<Invoice[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', contactName: '', cityId: '' });

  // Payment upload
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Booking request
  const [cities, setCities] = useState<City[]>([]);
  const [brCorners, setBrCorners] = useState<Corner[]>([]);
  const [brForm, setBrForm] = useState({ cityId: '', cornerId: '', message: '' });
  const [submittingBr, setSubmittingBr] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  type CompanyTab = 'profile' | 'corner' | 'booking';
  const [activeTab, setActiveTab] = React.useState<CompanyTab>('profile');

  const fetchData = async () => {
    try {
      const [pRes, payRes, brRes, invoicesRes] = await Promise.all([
        companyApi.getProfile(),
        companyApi.getPaymentStatus().catch(() => null),
        companyApi.getBookingRequests().catch(() => ({ data: { data: [] } })),
        companyApi.listInvoices().catch(() => ({ data: { data: [] } })),
      ]);
      const p = pRes.data.data!;
      setProfile(p);
      setEditForm({
        name: p.name,
        phone: p.phone || '',
        address: p.address || '',
        contactName: p.contactName,
        cityId: p.city?.id ? String(p.city.id) : '',
      });
      if (p.city?.id) {
        setBrForm((f) => ({ ...f, cityId: String(p.city.id) }));
      }
      if (payRes?.data?.data) setPaymentStatus(payRes.data.data);
      if (brRes?.data?.data) setBookingRequests(brRes.data.data as BookingRequest[]);
      if (invoicesRes?.data?.data) setInvoicesHistory(invoicesRes.data.data as Invoice[]);

      // Corner
      try {
        const cRes = await companyApi.getCorner();
        if (cRes.data?.data) setCorner(cRes.data.data);
      } catch { setCorner(null); }

      // Invoice
      try {
        const iRes = await companyApi.getInvoice();
        if (iRes.data?.data) setInvoice(iRes.data.data);
      } catch { setInvoice(null); }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If someone tries to open the company dashboard without being logged in,
    // return them to the home page (matches your request to avoid 404-like behavior).
    if (!user || user.role !== 'ROLE_COMPANY') { navigate('/'); return; }
    fetchData();
    // Keep dashboard in sync with admin actions (corner assignment / payment approval).
    const intervalId = window.setInterval(() => {
      fetchData();
    }, 8000);
    citiesApi.getAll().then(r => { if (r.data?.data) setCities(r.data.data); }).catch(() => {});
    return () => window.clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    const effectiveCityId = profile?.city?.id ? String(profile.city.id) : brForm.cityId;
    if (effectiveCityId) {
      cornersApi.getByCity(Number(effectiveCityId), 'AVAILABLE').then(r => {
        if (r.data?.data) setBrCorners(r.data.data);
      }).catch(() => setBrCorners([]));
    } else {
      setBrCorners([]);
    }
  }, [brForm.cityId, profile?.city?.id]);

  const handleUpdateProfile = async () => {
    try {
      await companyApi.updateProfile({
        ...editForm,
        cityId: editForm.cityId ? Number(editForm.cityId) : undefined,
      } as any);
      toast.success('Profile updated');
      setEditMode(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleUploadPayment = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await companyApi.uploadPayment(file);
      toast.success('Proof of payment uploaded successfully');
      setFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const res = await companyApi.downloadInvoice();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.invoiceNumber || 'invoice'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  const handleViewInvoiceById = async (invoiceId: number) => {
    try {
      const res = await companyApi.downloadInvoiceById(invoiceId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch {
      toast.error('Failed to open invoice');
    }
  };

  const handleDownloadInvoiceById = async (inv: Invoice) => {
    try {
      const res = await companyApi.downloadInvoiceById(inv.id!);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber || 'invoice'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  const handleSubmitBooking = async () => {
    const cityId = profile?.city?.id ?? Number(brForm.cityId);
    if (!cityId) { toast.error('Select a city'); return; }
    setSubmittingBr(true);
    try {
      const payload: any = { cityId };
      if (brForm.cornerId) payload.cornerId = Number(brForm.cornerId);
      if (brForm.message) payload.message = brForm.message;
      if (editingRequestId) {
        await companyApi.updateBookingRequest(editingRequestId, payload);
        toast.success('Booking request updated');
      } else {
        await companyApi.submitBookingRequest(payload);
        toast.success('Booking request submitted');
      }
      setEditingRequestId(null);
      setBrForm({ cityId: '', cornerId: '', message: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmittingBr(false);
    }
  };

  const handleEditBookingRequest = (br: BookingRequest) => {
    setEditingRequestId(br.id);
    setBrForm({
      cityId: String(br.city?.id || profile?.city?.id || ''),
      cornerId: br.corner?.id ? String(br.corner.id) : '',
      message: br.message || '',
    });
    setActiveTab('booking');
  };

  const handleUnassignSelf = async () => {
    setUnassigning(true);
    try {
      await companyApi.unassignMyCorner();
      toast.success('Corner unassigned. You can request a new corner now.');
      setEditingRequestId(null);
      setBrForm({ cityId: profile?.city?.id ? String(profile.city.id) : '', cornerId: '', message: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unassign corner');
    } finally {
      setUnassigning(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const companyCityName = profile?.city?.name || corner?.city?.name || corner?.cityName || '—';

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

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full">
        <Sidebar side="left">
          <SidebarContent className="px-2">
            <SidebarHeader>
              <div className="flex items-center gap-3 px-2">
                {/* Preserve original logo aspect ratio */}
                <img src={logo} alt="Winter Knights" className="h-12 w-auto object-contain" />
              </div>
            </SidebarHeader>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                    type="button"
                  >
                    <User size={16} className="text-gold" />
                    <span className="text-base font-semibold">Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'corner'}
                    onClick={() => setActiveTab('corner')}
                    type="button"
                  >
                    <CreditCard size={16} className="text-gold" />
                    <span className="text-base font-semibold">Payment and Invoices</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeTab === 'booking'}
                    onClick={() => setActiveTab('booking')}
                    type="button"
                  >
                    <Send size={16} className="text-gold" />
                    <span className="text-base font-semibold">Corner Bookings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 bg-muted/30">
          {/* Top bar */}
          <header className="gradient-navy sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-primary-foreground/70 text-sm hidden sm:inline">{profile?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground hover:text-gold"
                >
                  <LogOut size={16} className="mr-1" /> Logout
                </Button>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <h1 className="font-display text-3xl uppercase text-navy mb-6">Company Dashboard</h1>

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card><CardContent className="pt-6">
                <div className="flex items-center gap-3"><Building2 className="text-gold" size={24} /><div>
                  <p className="text-xs text-muted-foreground uppercase">Company ID</p>
                  <p className="font-display text-lg text-navy">{profile?.companyId}</p>
                </div></div>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="flex items-center gap-3"><MapPin className="text-gold" size={24} /><div>
                  <p className="text-xs text-muted-foreground uppercase">City</p>
                  <p className="font-display text-lg text-navy">{companyCityName}</p>
                </div></div>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="flex items-center gap-3"><MapPin className="text-gold" size={24} /><div>
                  <p className="text-xs text-muted-foreground uppercase">Corner</p>
                  <p className="font-display text-lg text-navy">{corner?.name || 'None assigned'}</p>
                  {corner ? (
                    <div className="mt-2">{statusBadge(corner.status)}</div>
                  ) : (
                    <div className="mt-2 text-muted-foreground text-xs">—</div>
                  )}
                </div></div>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="flex items-center gap-3"><CreditCard className="text-gold" size={24} /><div>
                  <p className="text-xs text-muted-foreground uppercase">Payment</p>
                  {statusBadge(profile?.paymentStatus || 'NOT_PAID')}
                </div></div>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="flex items-center gap-3"><FileText className="text-gold" size={24} /><div>
                  <p className="text-xs text-muted-foreground uppercase">Invoice</p>
                  {invoice ? statusBadge(invoice.status) : <span className="text-muted-foreground text-sm">None</span>}
                </div></div>
              </CardContent></Card>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as CompanyTab)}
              className="space-y-6"
            >
              <TabsList className="gradient-navy md:hidden">
                <TabsTrigger value="profile" className="text-primary-foreground data-[state=active]:text-gold data-[state=active]:bg-navy-light">Profile</TabsTrigger>
                <TabsTrigger value="corner" className="text-primary-foreground data-[state=active]:text-gold data-[state=active]:bg-navy-light">Payment and Invoices</TabsTrigger>
                <TabsTrigger value="booking" className="text-primary-foreground data-[state=active]:text-gold data-[state=active]:bg-navy-light">Corner Bookings</TabsTrigger>
              </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-xl text-navy">Company Profile</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                  {editMode ? 'Cancel' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label>Company Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div><Label>Contact Person</Label><Input value={editForm.contactName} onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))} /></div>
                      <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
                      <div><Label>Address</Label><Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
                      <div>
                        <Label>City</Label>
                        <Select value={editForm.cityId} onValueChange={v => setEditForm(f => ({ ...f, cityId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>
                            {cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleUpdateProfile} className="gradient-gold text-primary">Save Changes</Button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                      <div className="rounded-lg border bg-muted/20 p-4"><span className="text-muted-foreground">Company Name</span><p className="font-semibold text-base mt-1">{profile?.name}</p></div>
                      <div className="rounded-lg border bg-muted/20 p-4"><span className="text-muted-foreground">Email</span><p className="font-semibold text-base mt-1 break-all">{profile?.email}</p></div>
                      <div className="rounded-lg border bg-muted/20 p-4"><span className="text-muted-foreground">Contact Person</span><p className="font-semibold text-base mt-1">{profile?.contactName}</p></div>
                      <div className="rounded-lg border bg-muted/20 p-4"><span className="text-muted-foreground">Phone</span><p className="font-semibold text-base mt-1">{profile?.phone || '—'}</p></div>
                      <div className="rounded-lg border bg-muted/20 p-4"><span className="text-muted-foreground">City</span><p className="font-semibold text-base mt-1">{companyCityName}</p></div>
                      <div className="rounded-lg border bg-muted/20 p-4"><span className="text-muted-foreground">Company ID</span><p className="font-semibold text-base mt-1">{profile?.companyId}</p></div>
                      <div className="rounded-lg border bg-muted/20 p-4 sm:col-span-2 lg:col-span-3"><span className="text-muted-foreground">Address</span><p className="font-semibold text-base mt-1">{profile?.address || '—'}</p></div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border bg-card p-4">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Payment Status</div>
                        <div>{statusBadge(profile?.paymentStatus || 'NOT_PAID')}</div>
                      </div>
                      <div className="rounded-lg border bg-card p-4 text-right">
                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Corner Status</div>
                        <div className="font-medium">
                          {corner ? (
                            <span>{corner.name} ({corner.status})</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment and Invoices Tab */}
          <TabsContent value="corner">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="font-display text-xl text-navy">Assigned Corner</CardTitle></CardHeader>
                <CardContent>
                  {corner ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{corner.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">City</span><span className="font-medium">{companyCityName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-display text-gold">NAD {Number(corner.price).toLocaleString('en', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span>{statusBadge(corner.status)}</div>
                      {corner.status === 'RESERVED' && (
                        <Button
                          variant="outline"
                          className="w-full mt-3"
                          onClick={handleUnassignSelf}
                          disabled={unassigning}
                        >
                          {unassigning ? 'Unassigning...' : 'Unassign myself from this corner'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No corner assigned yet. Submit a booking request below.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="font-display text-xl text-navy">Current Invoice</CardTitle></CardHeader>
                <CardContent>
                  {invoice ? (
                    <div className="space-y-4 text-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 text-muted-foreground">Field</th>
                              <th className="text-left p-2 text-muted-foreground">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2">Invoice #</td>
                              <td className="p-2 font-medium">{invoice.invoiceNumber}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Amount</td>
                              <td className="p-2 font-display text-gold">
                                NAD {Number(invoice.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Status</td>
                              <td className="p-2">{statusBadge(invoice.status)}</td>
                            </tr>
                            <tr>
                              <td className="p-2">Issued</td>
                              <td className="p-2">{new Date(invoice.issuedAt).toLocaleDateString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewInvoiceById(invoice.id)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye size={16} className="mr-2" /> View PDF
                        </Button>
                        <Button
                          onClick={() => handleDownloadInvoiceById(invoice)}
                          variant="outline"
                          className="flex-1"
                        >
                          <FileText size={16} className="mr-2" /> Download
                        </Button>
                      </div>

                      {/* Upload Proof of Payment */}
                      {corner?.status === 'RESERVED' && invoice.status === 'PENDING' && (
                        <div className="border rounded-lg p-4 space-y-3">
                          <h3 className="font-display text-lg text-navy">Upload Proof of Payment</h3>
                          <p className="text-sm text-muted-foreground">
                            Accepted: PDF, JPG, PNG (max 10MB)
                          </p>
                          <div className="flex gap-4 items-end">
                            <div className="flex-1">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                              />
                            </div>
                            <Button
                              onClick={handleUploadPayment}
                              disabled={!file || uploading}
                              className="gradient-gold text-primary"
                            >
                              <Upload size={16} className="mr-2" />{' '}
                              {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No active invoice.</p>
                  )}
                </CardContent>
              </Card>
              </div>
            <Card>
              <CardHeader><CardTitle className="font-display text-xl text-navy">Invoice History for your bookings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">View / Download and see if each invoice is paid</p>
                    <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">
                      Payment records and booking invoice timeline
                    </p>
                  </div>
                  {profile?.paymentStatus === 'PAID' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <p className="text-green-700 font-display text-base">✓ Paid — your corner is BOOKED</p>
                    </div>
                  )}
                </div>

                {invoicesHistory.length === 0 ? (
                  <p className="text-muted-foreground">No invoices yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3">Invoice #</th>
                          <th className="text-left p-3">Corner</th>
                          <th className="text-left p-3">Amount</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Issued</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicesHistory.map((inv) => (
                          <tr key={inv.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-mono text-xs">{inv.invoiceNumber}</td>
                            <td className="p-3">{inv.corner?.name || '—'}</td>
                            <td className="p-3 font-display text-gold">
                              NAD {Number(inv.amount).toLocaleString('en', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3">{statusBadge(inv.status)}</td>
                            <td className="p-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => handleViewInvoiceById(inv.id)}
                                >
                                  <Eye size={14} className="mr-1" /> View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => handleDownloadInvoiceById(inv)}
                                >
                                  <FileText size={14} className="mr-1" /> Download
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Corner Bookings Tab */}
          <TabsContent value="booking">
            <div className="space-y-6">
              {(!corner || editingRequestId !== null) && (
                <Card>
                  <CardHeader className="border-b bg-gradient-to-r from-navy/5 via-background to-gold/10">
                    <CardTitle className="font-display text-xl text-navy">Submit Corner Booking Request</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete the form below and our team will review your application shortly.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="rounded-xl border bg-muted/20 p-4 sm:p-6">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Application details</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fields marked with * are required. You can submit with or without a preferred corner.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <Label className="mb-2 inline-block text-sm font-semibold">City *</Label>
                        <Select value={String(profile?.city?.id || brForm.cityId)} disabled>
                          <SelectTrigger className="h-11 bg-background">
                            <SelectValue placeholder="Company city" />
                          </SelectTrigger>
                          <SelectContent>
                            {profile?.city?.id ? (
                              <SelectItem value={String(profile.city.id)}>{profile.city.name}</SelectItem>
                            ) : (
                              cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 inline-block text-sm font-semibold">Preferred Corner (Optional)</Label>
                        <Select value={brForm.cornerId} onValueChange={v => setBrForm(f => ({ ...f, cornerId: v }))} disabled={!profile?.city?.id}>
                          <SelectTrigger className="h-11 bg-background">
                            <SelectValue placeholder="Any available" />
                          </SelectTrigger>
                          <SelectContent>
                            {brCorners.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 inline-block text-sm font-semibold">Message (Optional)</Label>
                      <Textarea
                        value={brForm.message}
                        onChange={e => setBrForm(f => ({ ...f, message: e.target.value }))}
                        maxLength={2000}
                        placeholder="Share any location preferences, timeline, or other important notes..."
                        className="min-h-32 resize-y bg-background"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Keep your message concise and include only relevant details.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-4">
                      <p className="text-sm text-muted-foreground">
                        Your application will appear in booking history once submitted.
                      </p>
                      <div className="flex gap-2">
                        {editingRequestId && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingRequestId(null);
                              setBrForm({ cityId: profile?.city?.id ? String(profile.city.id) : '', cornerId: '', message: '' });
                            }}
                          >
                            Cancel edit
                          </Button>
                        )}
                        <Button onClick={handleSubmitBooking} disabled={submittingBr} className="gradient-gold text-primary min-w-44">
                          <Send size={16} className="mr-2" /> {submittingBr ? (editingRequestId ? 'Updating...' : 'Submitting...') : (editingRequestId ? 'Update Request' : 'Submit Request')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="font-display text-xl text-navy">Corner Booking History</CardTitle></CardHeader>
                <CardContent>
                  {bookingRequests.length === 0 ? (
                    <p className="text-muted-foreground">No booking requests yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b">
                          <th className="text-left py-2 text-muted-foreground">City</th>
                          <th className="text-left py-2 text-muted-foreground">Corner</th>
                          <th className="text-left py-2 text-muted-foreground">Status</th>
                          <th className="text-left py-2 text-muted-foreground">Date</th>
                          <th className="text-left py-2 text-muted-foreground">Actions</th>
                        </tr></thead>
                        <tbody>
                          {bookingRequests.map(br => (
                            <tr key={br.id} className="border-b">
                              <td className="py-3">{br.city?.name}</td>
                              <td className="py-3">{br.corner?.name || '—'}</td>
                              <td className="py-3">{statusBadge(br.status)}</td>
                              <td className="py-3">{new Date(br.requestedAt).toLocaleDateString()}</td>
                              <td className="py-3">
                                {(br.status === 'PENDING' || br.status === 'RESERVED') && (
                                  <Button size="sm" variant="outline" onClick={() => handleEditBookingRequest(br)}>
                                    Edit
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CompanyDashboard;
