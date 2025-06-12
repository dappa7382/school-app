import { createClient } from '@/utils/supabase/server';
import { getUserPermissions } from '@/utils/supabase/queries';
import type { Invoice } from '@/types';

// Error component
function ErrorMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-xl font-bold text-red-600 mb-2">{title}</h2>
      <p className="text-red-700">{message}</p>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data invoice</h3>
      <p className="text-gray-500">Belum ada transaksi keuangan yang tercatat.</p>
    </div>
  );
}

export default async function FinancesPage() {
  const supabase = await createClient();

  try {
    // 1. Dapatkan sesi pengguna
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return <ErrorMessage title="Authentication Error" message={authError.message} />;
    }

    if (!user) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">Login Required</h2>
          <p className="text-yellow-700">Silakan login terlebih dahulu untuk mengakses halaman ini.</p>
        </div>
      );
    }

    // 2. Dapatkan izin pengguna
    const permissions = await getUserPermissions(user.id);

    // 3. Cek izin
    const canViewFinances = permissions.includes('VIEW_FINANCIAL_DATA');

    if (!canViewFinances) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-red-700">Anda tidak memiliki izin untuk melihat data keuangan.</p>
        </div>
      );
    }

    // 4. Ambil data invoices dengan join ke student untuk nama siswa
    const { data: invoices, error } = await supabase
      .from('Invoices')
      .select(`
        *,
        Students (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return <ErrorMessage title="Error Database" message={`Gagal memuat data keuangan: ${error.message}`} />;
    }

    // Ensure invoices is an array and has proper typing
    const typedInvoices: (Invoice & { Students?: { first_name: string; last_name: string } })[] = invoices || [];

    // Calculate totals using typedInvoices
    const totalRevenue = typedInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    const paidInvoices = typedInvoices.filter(invoice => invoice.status === 'Paid').length;
    const pendingInvoices = typedInvoices.filter(invoice => invoice.status === 'Unpaid').length;

    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Keuangan</h1>
          <p className="text-gray-600">Kelola dan pantau transaksi keuangan sekolah</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Pendapatan</h3>
                <p className="text-2xl font-bold text-gray-900">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Invoice Lunas</h3>
                <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Invoice Pending</h3>
                <p className="text-2xl font-bold text-gray-900">{pendingInvoices}</p>
              </div>
            </div>
          </div>
        </div>
        
        {!typedInvoices || typedInvoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Daftar Invoice</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jatuh Tempo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typedInvoices.map((invoice) => (
                    <tr key={invoice.invoice_id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{invoice.invoice_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.Students ? `${invoice.Students.first_name} ${invoice.Students.last_name}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {invoice.notes || 'Tidak ada deskripsi'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'Unpaid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : invoice.status === 'Overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status === 'Paid' ? 'Lunas' : 
                           invoice.status === 'Unpaid' ? 'Belum Bayar' : 
                           invoice.status === 'Overdue' ? 'Terlambat' : 
                           invoice.status === 'Partially Paid' ? 'Bayar Sebagian' :
                           invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rp {invoice.total_amount ? invoice.total_amount.toLocaleString('id-ID') : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Tidak ada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );

  } catch (error) {
    console.error('Unexpected error in FinancesPage:', error);
    return (
      <ErrorMessage 
        title="Kesalahan Sistem" 
        message="Terjadi kesalahan tak terduga. Silakan muat ulang halaman atau hubungi administrator." 
      />
    );
  }
}
