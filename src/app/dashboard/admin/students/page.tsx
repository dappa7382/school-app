'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Gender = 'Laki-laki' | 'Perempuan';

interface Student {
  id: number;
  user_id: number;
  nis: string;
  nama: string;
  kelas: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  gender: Gender;
}

interface StudentFormData {
  nis: string;
  nama: string;
  kelas: string;
  gender: Gender;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    nis: '',
    nama: '',
    kelas: '',
    gender: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation functions
  const navigateToDashboard = () => router.push('/dashboard/admin');
  const navigateToUsers = () => router.push('/dashboard/admin/users');
  const navigateToTeachers = () => router.push('/dashboard/admin/teachers');
  const navigateToSchedules = () => {
    router.push('/dashboard/admin/schedules');
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('nama');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // CRUD operations
  const handleDelete = async (id: number) => {
  if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
    return;
  }

  try {
    // 1. Hapus nilai siswa terlebih dahulu
    const { error: nilaiError } = await supabase
      .from('nilai_siswa')
      .delete()
      .eq('siswa_id', id);

    if (nilaiError) throw nilaiError;

    // 2. Ambil user_id dari siswa
    const { data: siswa, error: fetchError } = await supabase
      .from('siswa')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 3. Hapus data siswa
    const { error: siswaError } = await supabase
      .from('siswa')
      .delete()
      .eq('id', id);

    if (siswaError) throw siswaError;

    // 4. Hapus user terkait
    if (siswa?.user_id) {
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', siswa.user_id);

      if (userError) throw userError;
    }

    setStudents(students.filter(s => s.id !== id));
    alert('Siswa berhasil dihapus');

  } catch (error) {
    console.error('Detail error:', error);
    alert(
      `Gagal menghapus siswa. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

  const handleUpdate = async (id: number, data: StudentFormData) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('siswa')
        .update({
          nis: data.nis,
          nama: data.nama,
          kelas: data.kelas,
          gender: data.gender,
          tempat_lahir: data.tempat_lahir || null,
          tanggal_lahir: data.tanggal_lahir || null,
          alamat: data.alamat || null
        })
        .eq('id', id);

      if (error) throw error;

      fetchStudents();
      setIsModalOpen(false);
      alert('Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      handleUpdate(selectedStudent.id, formData);
    }
  };

  const openEditModal = (student: Student) => {
    setIsEditing(true);
    setSelectedStudent(student);
    setFormData({
      nis: student.nis,
      nama: student.nama,
      kelas: student.kelas,
      gender: student.gender,
      tempat_lahir: student.tempat_lahir || '',
      tanggal_lahir: student.tanggal_lahir || '',
      alamat: student.alamat || ''
    });
    setIsModalOpen(true);
  };

  // Add a function to get unique class values
  const getUniqueClasses = () => {
    const classes = new Set(students.map(student => student.kelas));
    return Array.from(classes).sort();
  };

  // Update the filtered students logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = !classFilter || student.kelas === classFilter;
    const matchesGender = !genderFilter || student.gender === genderFilter;

    return matchesSearch && matchesClass && matchesGender;
  });

  // Add toggleMobileMenu function
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
                {/* Navigation links */}
                <a className="sidebar-link cursor-pointer" onClick={navigateToDashboard}>
                  <span className="material-icons">dashboard</span>
                  <span className="text-sm">Dashboard</span>
                </a>
                <a className="sidebar-link cursor-pointer" onClick={navigateToUsers}>
                  <span className="material-icons">manage_accounts</span>
                  <span className="text-sm">Users</span>
                </a>
                <a className="sidebar-link active cursor-pointer">
                  <span className="material-icons">school</span>
                  <span className="text-sm">Students</span>
                </a>
                <a className="sidebar-link cursor-pointer" onClick={navigateToTeachers}>
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
              <h2 className="text-[var(--primary-text-color)] text-3xl font-bold leading-tight">Students</h2>
              <p className="text-[var(--secondary-text-color)] text-sm mt-1">Manage student profiles and academic records.</p>
            </header>

            {/* Responsive Search and Filters */}
            <div className="mb-6 space-y-4">
              <label className="relative flex items-center">
                <span className="material-icons absolute left-3 text-[var(--secondary-text-color)]">search</span>
                <input
                  type="search"
                  className="form-input w-full rounded-lg border border-[var(--border-color)] bg-[var(--background-color)] h-12 pl-10 pr-4 text-sm"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  className="form-select rounded-lg border border-[var(--border-color)] bg-[var(--background-color)] h-12 px-4 text-sm flex-1"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {getUniqueClasses().map(kelas => (
                    <option key={kelas} value={kelas}>{kelas}</option>
                  ))}
                </select>

                <select
                  className="form-select rounded-lg border border-[var(--border-color)] bg-[var(--background-color)] h-12 px-4 text-sm flex-1"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            {/* Mobile Card View / Desktop Table View */}
            <div className="block lg:hidden">
              {loading ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{student.nama}</h3>
                          <p className="text-sm text-gray-600">NIS: {student.nis}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openEditModal(student)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Class</p>
                          <p>{student.kelas}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Gender</p>
                          <p>{student.gender}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Address</p>
                          <p>{student.alamat || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-lg border border-[var(--border-color)] bg-white shadow-sm">
              {loading ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[var(--accent-color)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">NIS</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Place of Birth</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Date of Birth</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {/* Student rows */}
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{student.id}</td>
                        <td className="px-6 py-4 text-sm">{student.nis}</td>
                        <td className="px-6 py-4 text-sm">{student.nama}</td>
                        <td className="px-6 py-4 text-sm">{student.kelas}</td>
                        <td className="px-6 py-4 text-sm">{student.gender}</td>
                        <td className="px-6 py-4 text-sm">{student.tempat_lahir || '-'}</td>
                        <td className="px-6 py-4 text-sm">{student.tanggal_lahir || '-'}</td>
                        <td className="px-6 py-4 text-sm">{student.alamat || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            onClick={() => openEditModal(student)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
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
                Showing {students.length} students
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Add Student/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                Edit Student
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="studentForm" onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields similar to teacher form */}
                <div>
                  <label className="block text-sm font-medium mb-1">NIS</label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={e => setFormData({...formData, nis: e.target.value})}
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
                  <label className="block text-sm font-medium mb-1">Class</label>
                  <input
                    type="text"
                    value={formData.kelas}
                    onChange={e => setFormData({...formData, kelas: e.target.value})}
                    className="w-full rounded border p-2"
                    required
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
                  form="studentForm"
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