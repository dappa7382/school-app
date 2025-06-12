// Copilot, buat halaman untuk menampilkan daftar siswa.
// Ini adalah Server Component.
// 1. Impor createClient dari utils/supabase/server.
// 2. Buat fungsi async untuk mengambil semua data dari tabel 'Students'. Urutkan berdasarkan first_name.
// 3. Tangani jika terjadi error saat pengambilan data.
// 4. Tampilkan data dalam sebuah tabel (gunakan komponen dari shadcn/ui jika Anda menginstalnya).
// 5. Kolom yang ditampilkan: Nama Lengkap, Tanggal Pendaftaran, Status Pendaftaran.
// 6. Tambahkan tombol link "Tambah Siswa Baru" di atas tabel yang mengarah ke /dashboard/students/new.

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function StudentsPage() {
  const supabase = await createClient();

  // 2. Mengambil data siswa
  const { data: students, error } = await supabase
    .from('Students')
    .select('student_id, first_name, last_name, admission_date, enrollment_status')
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching students:', error);
    return <p className="text-red-500">Gagal memuat data siswa.</p>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Siswa</h1>
        {/* 6. Tombol Tambah Siswa */}
        <Link href="/dashboard/students/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Tambah Siswa Baru
        </Link>
      </div>

      {/* 4. Tabel untuk menampilkan data */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border">Nama Lengkap</th>
              <th className="py-2 px-4 border">Tanggal Pendaftaran</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td className="py-2 px-4 border">{`${student.first_name} ${student.last_name}`}</td>
                <td className="py-2 px-4 border">{new Date(student.admission_date).toLocaleDateString('id-ID')}</td>
                <td className="py-2 px-4 border">{student.enrollment_status}</td>
                <td className="py-2 px-4 border">
                  <Link href={`/dashboard/students/${student.student_id}/edit`} className="text-blue-500 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}