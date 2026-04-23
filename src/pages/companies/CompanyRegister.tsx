import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, citiesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { City } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const CompanyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    contactName: '', phone: '', address: '', cityId: ''
  });

  useEffect(() => {
    citiesApi.getAll().then(r => { if (r.data?.data) setCities(r.data.data); }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        cityId: Number(form.cityId),
      };

      await authApi.register(payload);
      toast.success('Registration successful! Please check your email to verify your account.');
      setRegistered(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Winter Knights" className="h-12 mx-auto mb-4" />
          <h1 className="font-display text-3xl uppercase text-navy">Register Company</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {registered ? 'Check your inbox to verify your account.' : 'Create your account'}
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
              className="w-full gradient-gold text-primary font-display uppercase tracking-wider"
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
            <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>Password *</Label><Input type="password" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)} /></div>
            <div><Label>Company Name *</Label><Input required value={form.name} onChange={e => update('name', e.target.value)} /></div>
            <div><Label>Contact Person *</Label><Input required value={form.contactName} onChange={e => update('contactName', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => update('address', e.target.value)} /></div>

          <div>
            <Label>City *</Label>
            <Select value={form.cityId} onValueChange={v => update('cityId', v)}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary font-display uppercase tracking-wider">
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
