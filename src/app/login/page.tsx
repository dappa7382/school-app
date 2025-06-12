'use client'; // Halaman ini interaktif, jadi harus Client Component

// Copilot, buat halaman login menggunakan Auth component dari @supabase/auth-ui-react
// 1. Impor createClient dari utils/supabase/client
// 2. Impor Auth dari @supabase/auth-ui-react dan ThemeSupa dari @supabase/auth-ui-shared
// 3. Inisialisasi Supabase client
// 4. Render komponen Auth dengan tema ThemeSupa
// 5. Gunakan provider hanya 'email' dan 'google'
// 6. Arahkan pengguna ke '/dashboard' setelah login berhasil

import { createClient } from '@/utils/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
        // Refresh untuk memastikan server-side logic berjalan dengan session baru
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);


  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Login ke Sistem Manajemen Sekolah</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']} // Tambahkan provider lain jika perlu, misal: 'github'
          redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`} // Pastikan URL ini ada di Supabase Auth settings
        />
      </div>
    </div>
  );
}