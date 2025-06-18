'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Query ke tabel users untuk cek username dan password
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, role_id')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (userError || !userData) {
        setError('Username atau password salah');
        setLoading(false);
        return;
      }      console.log('Login successful:', userData);
        // Set user data in cookies for middleware with proper encoding
      document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400; SameSite=Lax`;
      
      // Get the redirect URL from the query params or use default based on role
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('from') || (() => {
        switch (userData.role_id) {
          case 1: return '/dashboard/admin';
          case 2: return '/dashboard/guru';
          case 3: return '/dashboard/siswa';
          default: return '/dashboard';
        }
      })();
      
      console.log('Redirecting to:', redirectTo);
      router.push(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-solid border-b-[#F2F2F2] px-6 sm:px-10 py-4 bg-white">
        <div className="flex items-center gap-3 text-[#141414]">
          <div className="size-6 text-[#141414]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_6_319)"><path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path></g><defs><clipPath id="clip0_6_319"><rect fill="white" height="48" width="48"></rect></clipPath></defs></svg>
          </div>
          <h2 className="text-[#141414] text-xl font-bold leading-tight tracking-[-0.015em]">AC</h2>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center py-10 sm:py-16 px-4">
        <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-[#141414] text-3xl font-bold leading-tight tracking-tight">Selamat Datang</h2>
            <p className="text-[#757575] text-sm mt-2">Please enter your credentials to login.</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium leading-6 text-[#141414] pb-1.5" htmlFor="username">Username</label>
              <input
                className="form-input block w-full rounded-lg border-0 py-3 px-4 text-[#141414] shadow-sm ring-1 ring-inset ring-[#E0E0E0] placeholder:text-[#757575] focus:ring-2 focus:ring-inset focus:ring-[#4A90E2] sm:text-sm sm:leading-6 transition-colors duration-150"
                id="username"
                name="username"
                placeholder="e.g. john.doe"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-[#141414] pb-1.5" htmlFor="password">Password</label>
              <input
                className="form-input block w-full rounded-lg border-0 py-3 px-4 text-[#141414] shadow-sm ring-1 ring-inset ring-[#E0E0E0] placeholder:text-[#757575] focus:ring-2 focus:ring-inset focus:ring-[#4A90E2] sm:text-sm sm:leading-6 transition-colors duration-150"
                id="password"
                name="password"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {/* Optional: Remember me & forgot password UI, not functional */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 rounded border-gray-300 text-[#4A90E2] focus:ring-[#4A90E2] cursor-pointer"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <label className="ml-2 block text-sm text-[#757575] cursor-pointer" htmlFor="remember-me">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  className="font-semibold text-[#4A90E2] hover:text-blue-600 focus:outline-none"
                  onClick={() => alert('Silakan hubungi admin untuk reset password.')}
                >
                  Forgot password?
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div>
              <button
                className="flex w-full justify-center rounded-lg bg-[#141414] px-4 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414] transition-colors duration-150 cursor-pointer"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}