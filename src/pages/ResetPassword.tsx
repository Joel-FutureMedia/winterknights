import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successfully');
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        <img src={logo} alt="Winter Knights" className="h-20 w-auto object-contain mx-auto mb-4" />
        <h1 className="font-display text-2xl uppercase text-navy mb-4">Reset Password</h1>
        {done ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">Your password has been reset.</p>
            <Link to="/companies/login" className="text-gold hover:underline text-sm">Login Now</Link>
          </div>
        ) : !token ? (
          <p className="text-destructive">Invalid or missing reset token.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left"><Label>New Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full gradient-gold text-white font-display uppercase">
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
