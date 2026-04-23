import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const CompanyLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const d = res.data.data!;
      if (d.role !== 'ROLE_COMPANY') {
        toast.error('This login is for companies only. Use /admin for admin login.');
        return;
      }
      login(d.token, d.email, d.role, d.companyId);
      toast.success('Welcome back!');
      navigate('/companies');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Winter Knights" className="h-12 mx-auto mb-4" />
          <h1 className="font-display text-3xl uppercase text-navy">Company Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary font-display uppercase tracking-wider">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="block text-gold hover:underline">Forgot Password?</Link>
          <p>Don't have an account? <Link to="/companies/register" className="text-gold hover:underline">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
