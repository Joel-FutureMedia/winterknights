import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { Link } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => { setStatus('success'); toast.success('Email verified!'); })
      .catch(() => { setStatus('error'); toast.error('Verification failed'); });
  }, [token]);

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        <img src={logo} alt="Winter Knights" className="h-20 w-auto object-contain mx-auto mb-4" />
        <h1 className="font-display text-2xl uppercase text-navy mb-4">Email Verification</h1>
        {status === 'loading' && <p className="text-muted-foreground">Verifying...</p>}
        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium text-lg">Registration successful</p>
            <p className="text-primary-foreground/70 text-sm">
              Your account is verified. Click the button below to login to your dashboard.
            </p>

            <div className="pt-2 space-y-2">
              <Link
                to="/companies/login"
                className="inline-flex items-center justify-center w-full gradient-gold text-white font-display uppercase tracking-wider py-3 rounded-md hover:opacity-95 transition"
              >
                Login to dashboard
              </Link>
              <p className="text-muted-foreground text-xs">
                If you already have an account, please log in using the same email you registered with.
              </p>
            </div>
          </div>
        )}
        {status === 'error' && <p className="text-destructive">Invalid or expired verification link.</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
