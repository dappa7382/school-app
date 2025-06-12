'use client';

// Copilot, buat form untuk menambahkan siswa baru.
// 1. Gunakan hook useState untuk mengelola setiap input form (first_name, last_name, date_of_birth, admission_date, dll).
// 2. Buat fungsi handleSubmit yang akan dijalankan saat form di-submit.
// 3. Di dalam handleSubmit, gunakan Supabase client untuk menyisipkan data baru ke tabel 'Students'.
// 4. Gunakan useRouter untuk mengarahkan kembali ke halaman /dashboard/students setelah berhasil.
// 5. Tampilkan notifikasi atau pesan error jika terjadi kegagalan.
// 6. Form harus memiliki input untuk: Nama Depan, Nama Belakang, Tanggal Lahir, Tanggal Pendaftaran, dan informasi lain yang relevan dari tabel Students.

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewStudentPage() {
  const supabase = createClient();
  const router = useRouter();
  
  // 1. State untuk form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Fungsi submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 3. Insert data ke Supabase
    const { error: insertError } = await supabase.from('Students').insert({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      admission_date: admissionDate,
      // tambahkan field lain jika perlu
    });

    if (insertError) {
      // 5. Tampilkan error
      console.error('Error inserting student:', insertError);
      setError('Gagal menambahkan siswa. ' + insertError.message);
    } else {
      // 4. Redirect
      alert('Siswa berhasil ditambahkan!');
      router.push('/dashboard/students');
      router.refresh(); // Penting untuk me-refresh data di halaman list
    }
    setLoading(false);
  };

  // 6. Form
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tambah Siswa Baru</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        {/* ... tambahkan input field untuk first_name, last_name, dll ... */}
        <div>
          <label htmlFor="firstName">Nama Depan</label>
          <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full p-2 border rounded"/>
        </div>
        <div>
          <label htmlFor="lastName">Nama Belakang</label>
          <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full p-2 border rounded"/>
        </div>
        <div>
          <label htmlFor="dob">Tanggal Lahir</label>
          <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className="w-full p-2 border rounded"/>
        </div>
        <div>
          <label htmlFor="admissionDate">Tanggal Pendaftaran</label>
          <input id="admissionDate" type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} required className="w-full p-2 border rounded"/>
        </div>
        
        {error && <p className="text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
          {loading ? 'Menyimpan...' : 'Simpan Siswa'}
        </button>
      </form>
    </div>
  );
}