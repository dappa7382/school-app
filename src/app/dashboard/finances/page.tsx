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
      <p>Selamat datang, Anda memiliki akses ke data keuangan.</p>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error loading financial data: {error.message}
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
        {invoices && invoices.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.amount || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.status || 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data</h3>
            <p className="text-gray-600">No invoices or financial records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}