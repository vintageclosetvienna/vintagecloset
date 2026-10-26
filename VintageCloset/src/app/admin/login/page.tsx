'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { readHint } from '@/lib/password-hint';
import { SITE_URL } from '@/lib/site';
import { Eye, EyeSlash, Spinner, Lock } from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Forgot password: send a reset link; the hint (if this browser has one) can be shown on request
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const hint = readHint(email);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('forgot') === '1') setForgot(true);
  }, []);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const origin = window.location.hostname === 'localhost' ? window.location.origin : SITE_URL;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/admin/reset` });
    setIsLoading(false);
    // Same answer whether or not the address has an account, so the form does not reveal who is on the team
    if (error && !/not found|user/i.test(error.message)) setError(error.message);
    else setResetSent(true);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (error.message.includes('Supabase not configured')) {
          setError('Authentication not configured. Please set up Supabase.');
        } else {
          setError(error.message);
        }
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <Spinner size={32} className="animate-spin text-accent-start" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center">
            <Lock size={32} weight="fill" className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink">Admin Login</h1>
          <p className="text-muted mt-1">Sign in to access the dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-hairline p-8 shadow-sm">
          {forgot ? (
            <form onSubmit={sendReset} className="space-y-6">
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
              {resetSent ? (
                <div className="space-y-3 text-center">
                  <p className="text-4xl" aria-hidden>📬</p>
                  <p className="font-medium text-ink">Check your inbox</p>
                  <p className="text-sm text-muted">If <b>{email}</b> belongs to the team, a link to choose a new password is on its way. It works once, for one hour.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted">Type your admin email. We send you a link to choose a new password.</p>
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-ink mb-2">Email</label>
                    <input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-hairline bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-start/30 focus:border-accent-start transition-all" />
                  </div>
                  <Button type="submit" disabled={isLoading || !email} className="w-full">
                    {isLoading ? <><Spinner size={16} className="animate-spin mr-2" />Sending…</> : 'Send reset link'}
                  </Button>
                </>
              )}
              <button type="button" onClick={() => { setForgot(false); setResetSent(false); setError(null); }} className="w-full text-sm text-muted hover:text-ink">← Back to sign in</button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-ink mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vintagecloset.at"
                required
                className="w-full px-4 py-3 rounded-xl border border-hairline bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-start/30 focus:border-accent-start transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-ink mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-hairline bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-start/30 focus:border-accent-start transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? (
                    <EyeSlash size={20} weight="bold" />
                  ) : (
                    <Eye size={20} weight="bold" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Spinner size={16} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              {hint ? (
                <button type="button" onClick={() => setHintShown((v) => !v)} className="text-muted hover:text-ink">
                  💡 {hintShown ? 'Hide hint' : 'Show hint'}
                </button>
              ) : <span />}
              <button type="button" onClick={() => { setForgot(true); setError(null); }} className="font-medium text-accent-end hover:underline">
                Forgot password?
              </button>
            </div>
            {hint && hintShown && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">💡 {hint}</p>}
          </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          Vintage Closet Admin Panel
        </p>
      </div>
    </div>
  );
}

