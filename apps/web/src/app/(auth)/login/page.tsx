'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F2044] px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Check your email</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            We sent a magic link to{' '}
            <strong className="text-gray-800">{email}</strong>.
            <br />Click the link to sign in — it expires in 10 minutes.
          </p>
          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>Don&apos;t see it? Check your spam folder.</span>
            </div>
          </div>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F2044] px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-[#F59E0B] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-[#0F2044] font-display">PermitPro</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Welcome back</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your email to receive a secure magic link.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Work email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent transition disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending link…
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send magic link
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
