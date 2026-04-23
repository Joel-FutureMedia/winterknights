import React, { useState } from 'react';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch {
      toast.success('If the email exists, a reset link has been sent.');
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        <img src={logo} alt="Winter Knights" className="h-12 mx-auto mb-4" />
        <h1 className="font-display text-2xl uppercase text-navy mb-4">Forgot Password</h1>
        {sent ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">Check your email for a reset link.</p>
            <Link to="/companies/login" className="text-gold hover:underline text-sm">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left"><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary font-display uppercase">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
