'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Gender = 'Laki-laki' | 'Perempuan';

interface Teacher {
  id: number;
  user_id: number;
  nip: string;
  nama: string;
  spesialisasi: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  gender: Gender;
}

interface TeacherFormData {
  nip: string;
  nama: string;
  spesialisasi: string;
  gender: Gender;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<TeacherFormData>({
    nip: '',
    nama: '',
    spesialisasi: '',
    gender: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateToDashboard = () => {
    router.push('/dashboard/admin');
  };

  const navigateToUsers = () => {
    router.push('/dashboard/admin/users');
  };

  const navigateToStudents = () => {
    router.push('/dashboard/admin/students');
  };

  const navigateToSchedules = () => {
    router.push('/dashboard/admin/schedules');
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guru')
        .select('*')
        .order('nama');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) {
      return;
    }

    try {
      // 1. Hapus jadwal pelajaran terlebih dahulu
      const { error: jadwalError } = await supabase
        .from('jadwal_pelajaran')
        .delete()
        .eq('guru_id', id);

      if (jadwalError) throw jadwalError;

      // 2. Hapus mata pelajaran
      const { error: mapelError } = await supabase
        .from('mata_pelajaran')
        .delete()
        .eq('guru_id', id);

      if (mapelError) throw mapelError;

      // 3. Ambil user_id dari guru
      const { data: guru, error: fetchError } = await supabase
        .from('guru')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 4. Hapus data guru
      const { error: guruError } = await supabase
        .from('guru')
        .delete()
        .eq('id', id);

      if (guruError) throw guruError;

      // 5. Hapus user terkait
      if (guru?.user_id) {
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', guru.user_id);

        if (userError) throw userError;
      }

      setTeachers(teachers.filter(t => t.id !== id));
      alert('Guru berhasil dihapus');

    } catch (error) {
      console.error('Detail error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Gagal menghapus guru. Error: ${errorMessage}`);
    }
  };

  const handleUpdate = async (id: number, data: TeacherFormData) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('guru')
        .update({
          nip: data.nip,
          nama: data.nama,
          spesialisasi: data.spesialisasi || null,
          gender: data.gender,
          tempat_lahir: data.tempat_lahir || null,
          tanggal_lahir: data.tanggal_lahir || null,
          alamat: data.alamat || null
        })
        .eq('id', id);

      if (error) throw error;

      fetchTeachers();
      setIsModalOpen(false);
      alert('Teacher updated successfully');
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeacher) {
      handleUpdate(selectedTeacher.id, formData);
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setIsEditing(true);
    setSelectedTeacher(teacher);
    setFormData({
      nip: teacher.nip,
      nama: teacher.nama,
      spesialisasi: teacher.spesialisasi || '',
      gender: teacher.gender,
      tempat_lahir: teacher.tempat_lahir || '',
      tanggal_lahir: teacher.tanggal_lahir || '',
      alamat: teacher.alamat || ''
    });
    setIsModalOpen(true);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <h1 className="text-[var(--primary-text-color)] text-xl font-bold">Acme University</h1>
        <button onClick={toggleMobileMenu} className="p-2">
          <span className="material-icons">menu</span>
        </button>
      </div>

      <div className="flex h-full grow flex-col">
        <div className="flex flex-1">
          {/* Mobile Sidebar (Drawer) */}
          <aside className={`
            fixed lg:relative top-0 left-0 h-full z-40
            w-72 bg-white border-r border-[var(--border-color)] p-6
            transform transition-transform duration-300 ease-in-out
            lg:transform-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Close button for mobile */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden absolute top-4 right-4"
            >
              <span className="material-icons">close</span>
            </button>

            <div className="flex flex-col gap-6">
              <h1 className="text-[var(--primary-text-color)] text-xl font-bold leading-normal">Acme University</h1>
              <nav className="flex flex-col gap-2">
                <a 
                  className="sidebar-link cursor-pointer" 
                  onClick={navigateToDashboard}
                >
                  <span className="material-icons">dashboard</span>
                  <span className="text-sm">Dashboard</span>
                </a>
                <a 
                  className="sidebar-link cursor-pointer" 
                  onClick={navigateToUsers}
                >
                  <span className="material-icons">manage_accounts</span>
                  <span className="text-sm">Users</span>
                </a>
                <a 
                  className="sidebar-link cursor-pointer" 
                  onClick={navigateToStudents}
                >
                  <span className="material-icons">school</span>
                  <span className="text-sm">Students</span>
                </a>
                <a 
                  className="sidebar-link active cursor-pointer"
                >
                  <span className="material-icons">groups</span>
                  <span className="text-sm">Teachers</span>
                </a>
                <a 
                  className="sidebar-link cursor-pointer" 
                  onClick={navigateToSchedules}
                >
                  <span className="material-icons">schedule</span>
                  <span className="text-sm">Schedules</span>
                </a>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <a className="sidebar-link" href="#">
                <span className="material-icons">help_outline</span>
                <span className="text-sm">Help and Docs</span>
              </a>
            </div>
          </aside>

          {/* Overlay for mobile sidebar */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={toggleMobileMenu}
            />
          )}

          <main className="flex-1 p-4 lg:p-8 @container">
            <header className="mb-8">
              <h2 className="text-[var(--primary-text-color)] text-3xl font-bold leading-tight">Teachers</h2>
              <p className="text-[var(--secondary-text-color)] text-sm mt-1">Manage teacher profiles and assignments.</p>
            </header>

            {/* Responsive Search Bar */}
            <div className="mb-6">
              <label className="relative flex items-center">
                <span className="material-icons absolute left-3 text-[var(--secondary-text-color)]">search</span>
                <input
                  type="search"
                  className="form-input w-full rounded-lg border border-[var(--border-color)] bg-[var(--background-color)] h-12 pl-10 pr-4 text-sm"
                  placeholder="Search teachers..."
                />
              </label>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden">
              {loading ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{teacher.nama}</h3>
                          <p className="text-sm text-gray-600">NIP: {teacher.nip}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openEditModal(teacher)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(teacher.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Specialization</p>
                          <p>{teacher.spesialisasi || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Gender</p>
                          <p>{teacher.gender}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Address</p>
                          <p>{teacher.alamat || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-lg border">
              {loading ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[var(--accent-color)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">NIP</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Specialization</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Place of Birth</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Date of Birth</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{teacher.id}</td>
                        <td className="px-6 py-4 text-sm">{teacher.nip}</td>
                        <td className="px-6 py-4 text-sm">{teacher.nama}</td>
                        <td className="px-6 py-4 text-sm">{teacher.spesialisasi || '-'}</td>
                        <td className="px-6 py-4 text-sm">{teacher.gender}</td>
                        <td className="px-6 py-4 text-sm">{teacher.tempat_lahir || '-'}</td>
                        <td className="px-6 py-4 text-sm">{teacher.tanggal_lahir || '-'}</td>
                        <td className="px-6 py-4 text-sm">{teacher.alamat || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            onClick={() => openEditModal(teacher)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(teacher.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-[var(--secondary-text-color)]">
                Showing {teachers.length} teachers
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                Edit Teacher
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="teacherForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={e => setFormData({...formData, nip: e.target.value})}
                    className="w-full rounded border p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={e => setFormData({...formData, nama: e.target.value})}
                    className="w-full rounded border p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.spesialisasi}
                    onChange={e => setFormData({...formData, spesialisasi: e.target.value})}
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                    className="w-full rounded border p-2"
                    required
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Place of Birth</label>
                  <input
                    type="text"
                    value={formData.tempat_lahir}
                    onChange={e => setFormData({...formData, tempat_lahir: e.target.value})}
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})}
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.alamat}
                    onChange={e => setFormData({...formData, alamat: e.target.value})}
                    className="w-full rounded border p-2"
                    rows={3}
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="teacherForm"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}