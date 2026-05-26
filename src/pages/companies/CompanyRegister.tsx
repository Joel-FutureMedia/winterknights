import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, citiesApi, cornersApi, unwrapApiData, apiErrorMessage } from '@/lib/api';
import type { City, Corner } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const CompanyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [availableCorners, setAvailableCorners] = useState<Corner[]>([]);
  const [cornersLoading, setCornersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    contactName: '', phone: '', address: '', cityId: '', cornerId: 'none',
  });

  useEffect(() => {
    citiesApi.getAll()
      .then((r) => {
        const data = unwrapApiData<City[]>(r);
        if (data) setCities(data);
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load cities')));
  }, []);

  useEffect(() => {
    if (!form.cityId) {
      setAvailableCorners([]);
      setForm((f) => ({ ...f, cornerId: 'none' }));
      return;
    }
    setCornersLoading(true);
    cornersApi.getByCity(Number(form.cityId), 'AVAILABLE')
      .then((r) => {
        const data = unwrapApiData<Corner[]>(r);
        setAvailableCorners(data ?? []);
        setForm((f) => ({ ...f, cornerId: 'none' }));
      })
      .catch((err) => {
        setAvailableCorners([]);
        toast.error(apiErrorMessage(err, 'Failed to load available corners'));
      })
      .finally(() => setCornersLoading(false));
  }, [form.cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cornerId =
        form.cornerId && form.cornerId !== 'none' ? Number(form.cornerId) : undefined;

      await authApi.register({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        cityId: Number(form.cityId),
        ...(cornerId != null && Number.isFinite(cornerId) ? { cornerId } : {}),
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      setRegistered(true);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Winter Knights" className="h-24 w-auto object-contain mx-auto mb-4" />
          <h1 className="font-display text-3xl uppercase text-navy">Register Company</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {registered ? 'Check your inbox to verify your account.' : 'Create your account and choose a corner'}
          </p>
        </div>

        {registered ? (
          <div className="space-y-4 text-center">
            <div className="bg-muted rounded-lg p-5">
              <p className="text-navy font-display text-lg font-semibold">Registration successful</p>
              <p className="text-muted-foreground text-sm mt-2">
                Please verify your email. This is required before you can log in.
              </p>
            </div>
            <Button
              onClick={() => navigate('/companies/login')}
              className="w-full gradient-gold text-white font-display uppercase tracking-wider"
              disabled={loading}
            >
              Go to Login
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn’t receive the email? Check spam/junk folder and try again later.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
              <div><Label>Password *</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} /></div>
              <div><Label>Company Name *</Label><Input required value={form.name} onChange={(e) => update('name', e.target.value)} /></div>
              <div><Label>Contact Person *</Label><Input required value={form.contactName} onChange={(e) => update('contactName', e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => update('address', e.target.value)} /></div>

            <div>
              <Label>City *</Label>
              <Select value={form.cityId} onValueChange={(v) => update('cityId', v)}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.cityId && (
              <div>
                <Label>Preferred corner (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Available corners in your city. Selecting one reserves it until admin confirms your booking.
                </p>
                {cornersLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading corners…</p>
                ) : availableCorners.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 px-4 bg-muted rounded-lg">
                    No available corners in this city right now. You can register without a corner and request one later.
                  </p>
                ) : (
                  <ScrollArea className="h-48 rounded-lg border p-3">
                    <RadioGroup value={form.cornerId} onValueChange={(v) => update('cornerId', v)}>
                      <label className="flex items-center gap-2 py-2 cursor-pointer border-b last:border-0">
                        <RadioGroupItem value="none" id="corner-none" />
                        <span className="text-sm">No preference — choose later</span>
                      </label>
                      {availableCorners.map((corner) => (
                        <label
                          key={corner.id}
                          className="flex items-start gap-2 py-2 cursor-pointer border-b last:border-0"
                        >
                          <RadioGroupItem value={String(corner.id)} id={`corner-${corner.id}`} className="mt-1" />
                          <div className="text-sm flex-1">
                            <span className="font-medium">{corner.name}</span>
                            <span className="text-gold font-display ml-2">
                              NAD {Number(corner.price).toLocaleString('en', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </ScrollArea>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gradient-gold text-white font-display uppercase tracking-wider">
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/companies/login" className="text-gold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default CompanyRegister;
