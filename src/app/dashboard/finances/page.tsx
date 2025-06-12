// Copilot, buat halaman keuangan yang hanya bisa diakses oleh user dengan permission 'VIEW_FINANCIAL_DATA'
// 1. Dapatkan sesi pengguna saat ini. Jika tidak ada, redirect (middleware sudah menangani ini, tapi pengecekan ganda lebih aman).
// 2. Panggil fungsi `getUserPermissions` dengan user ID.
// 3. Cek apakah array permissions yang dikembalikan mengandung 'VIEW_FINANCIAL_DATA'.
// 4. Jika tidak, tampilkan pesan "Akses Ditolak".
// 5. Jika ya, tampilkan konten halaman keuangan (misal, daftar invoice dari tabel 'Invoices').

import { createClient } from '@/utils/supabase/server';
import { getUserPermissions } from '@/utils/supabase/queries';

export default async function FinancesPage() {
  const supabase = await createClient();

  // 1. Dapatkan sesi pengguna
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Seharusnya sudah ditangani middleware, tapi untuk keamanan
    return <p>Silakan login terlebih dahulu.</p>;
  }

  // 2. Dapatkan izin pengguna
  const permissions = await getUserPermissions(user.id);

  // 3. Cek izin
  const canViewFinances = permissions.includes('VIEW_FINANCIAL_DATA');

  // 4. Tampilkan pesan akses ditolak
  if (!canViewFinances) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-red-600">Akses Ditolak</h1>
        <p>Anda tidak memiliki izin untuk melihat data keuangan.</p>
      </div>
    );
  }

  // 5. Tampilkan konten halaman
  // (logika untuk fetch dan menampilkan data invoice disini)
  const { data: invoices, error } = await supabase.from('Invoices').select('*');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Laporan Keuangan</h1>
      <p>Selamat datang, Anda memiliki akses.</p>
      {/* Tampilkan data invoices disini */}
    </div>
  );
}