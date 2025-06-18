'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  password: string;
  role_id: number;
  role: {
    id: number;
    nama_role: string;
  };
  // Optional joined data
  siswa?: {
    nis: string;
    nama: string;
    kelas: string;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    alamat?: string;
    gender: 'Laki-laki' | 'Perempuan';
  };
  guru?: {
    nip: string;
    nama: string;
    spesialisasi?: string;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    alamat?: string;
    gender: 'Laki-laki' | 'Perempuan';
  };
}

interface UserFormData {
  username: string;
  password: string;
  role_id: number;
  // Student fields
  nis?: string;
  kelas?: string;
  // Teacher fields
  nip?: string;
  spesialisasi?: string;
  // Common fields
  nama?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role_id: 0,
    // Initialize all optional fields
    nis: '',
    kelas: '',
    nip: '',
    spesialisasi: '',
    nama: '',
    gender: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          password,
          role_id,
          role:roles(id, nama_role),
          siswa(nis, nama, kelas, tempat_lahir, tanggal_lahir, alamat, gender),
          guru(nip, nama, spesialisasi, tempat_lahir, tanggal_lahir, alamat, gender)
        `)
        .order('username');

      if (error) throw error;
      
      setUsers(data?.map(user => ({
        ...user,
        role: Array.isArray(user.role) ? user.role[0] : user.role,
        siswa: Array.isArray(user.siswa) ? user.siswa[0] : user.siswa,
        guru: Array.isArray(user.guru) ? user.guru[0] : user.guru
      })) || []);

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const username = user.username.toLowerCase();
    const role = user.role.nama_role.toLowerCase();
    
    return username.includes(searchLower) || role.includes(searchLower);
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      return;
    }

    try {
      // 1. Cek dan hapus data nilai siswa jika user adalah siswa
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('id')
        .eq('user_id', id)
        .single();

      if (siswaData) {
        const { error: nilaiError } = await supabase
          .from('nilai_siswa')
          .delete()
          .eq('siswa_id', siswaData.id);

        if (nilaiError) throw nilaiError;
      }

      // 2. Cek dan hapus data jadwal dan mata pelajaran jika user adalah guru
      const { data: guruData } = await supabase
        .from('guru')
        .select('id')
        .eq('user_id', id)
        .single();

      if (guruData) {
        // Hapus jadwal terlebih dahulu
        const { error: jadwalError } = await supabase
          .from('jadwal_pelajaran')
          .delete()
          .eq('guru_id', guruData.id);

        if (jadwalError) throw jadwalError;

        // Hapus mata pelajaran
        const { error: mapelError } = await supabase
          .from('mata_pelajaran')
          .delete()
          .eq('guru_id', guruData.id);

        if (mapelError) throw mapelError;
      }

      // 3. Hapus data siswa jika ada
      if (siswaData) {
        const { error: siswaError } = await supabase
          .from('siswa')
          .delete()
          .eq('user_id', id);

        if (siswaError) throw siswaError;
      }

      // 4. Hapus data guru jika ada
      if (guruData) {
        const { error: guruError } = await supabase
          .from('guru')
          .delete()
          .eq('user_id', id);

        if (guruError) throw guruError;
      }

      // 5. Terakhir hapus user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (userError) throw userError;

      setUsers(users.filter(u => u.id !== id));
      alert('Pengguna berhasil dihapus');

    } catch (error) {
      console.error('Detail error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Gagal menghapus pengguna. Error: ${errorMessage}`);
    }
  };

  const handleCreate = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);

      // Validate required fields based on role
      if (data.role_id === 2 && (!data.nip || !data.nama)) {
        throw new Error('NIP and Name are required for teachers');
      }
      if (data.role_id === 3 && (!data.nis || !data.nama || !data.kelas)) {
        throw new Error('NIS, Name, and Class are required for students');
      }

      // 1. Create user first
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          username: data.username,
          password: data.password,
          role_id: data.role_id
        }])
        .select()
        .single();

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      if (!newUser?.id) {
        throw new Error('No user ID returned after creating user');
      }

      // 2. Create role-specific record
      if (data.role_id === 2) { // Teacher
        const { error: teacherError } = await supabase
          .from('guru')
          .insert([{
            user_id: newUser.id,
            nip: data.nip!,
            nama: data.nama!,
            spesialisasi: data.spesialisasi || null,
            gender: data.gender || 'Laki-laki',
            tempat_lahir: data.tempat_lahir || null,
            tanggal_lahir: data.tanggal_lahir || null,
            alamat: data.alamat || null
          }]);

        if (teacherError) {
          // Rollback user creation
          await supabase.from('users').delete().eq('id', newUser.id);
          throw new Error(`Failed to create teacher: ${teacherError.message}`);
        }
      } else if (data.role_id === 3) { // Student
        const { error: studentError } = await supabase
          .from('siswa')
          .insert([{
            user_id: newUser.id,
            nis: data.nis!,
            nama: data.nama!,
            kelas: data.kelas!,
            gender: data.gender || 'Laki-laki',
            tempat_lahir: data.tempat_lahir || null,
            tanggal_lahir: data.tanggal_lahir || null,
            alamat: data.alamat || null
          }]);

        if (studentError) {
          // Rollback user creation
          await supabase.from('users').delete().eq('id', newUser.id);
          throw new Error(`Failed to create student: ${studentError.message}`);
        }
      }

      await fetchUsers();
      setIsModalOpen(false);
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, data: UserFormData) => {
    try {
      setIsSubmitting(true);

      // 1. Update user
      const updateData: any = {
        username: data.username,
        role_id: data.role_id,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (userError) throw userError;

      // 2. Update role-specific data
      if (data.role_id === 2) { // Teacher
        const { error: teacherError } = await supabase
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
          .eq('user_id', id);

        if (teacherError) throw teacherError;
      } else if (data.role_id === 3) { // Student
        const { error: studentError } = await supabase
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
          .eq('user_id', id);

        if (studentError) throw studentError;
      }

      await fetchUsers();
      setIsModalOpen(false);
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedUser) {
      handleUpdate(selectedUser.id, formData);
    } else {
      handleCreate(formData);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      password: '',
      role_id: 0,
      // Initialize all optional fields
      nis: '',
      kelas: '',
      nip: '',
      spesialisasi: '',
      nama: '',
      gender: 'Laki-laki',
      tempat_lahir: '',
      tanggal_lahir: '',
      alamat: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Clear password field when editing
      role_id: user.role_id,
      // Populate role-specific fields
      nis: user.siswa?.nis || '',
      kelas: user.siswa?.kelas || '',
      nip: user.guru?.nip || '',
      spesialisasi: user.guru?.spesialisasi || '',
      nama: user.siswa?.nama || user.guru?.nama || '',
      gender: user.siswa?.gender || user.guru?.gender || 'Laki-laki',
      tempat_lahir: user.siswa?.tempat_lahir || user.guru?.tempat_lahir || '',
      tanggal_lahir: user.siswa?.tanggal_lahir || user.guru?.tanggal_lahir || '',
      alamat: user.siswa?.alamat || user.guru?.alamat || ''
    });
    setIsModalOpen(true);
  };

  const navigateToDashboard = () => {
    router.push('/dashboard/admin');
  };

  // Add navigation functions
  const navigateToStudents = () => {
    router.push('/dashboard/admin/students');
  };

  const navigateToTeachers = () => {
    router.push('/dashboard/admin/teachers');
  };

  const navigateToSchedules = () => {
    router.push('/dashboard/admin/schedules');
  };

  // Add this function to render role-specific fields
  const renderRoleFields = () => {
    if (!formData.role_id) return null;

    return (
      <>
        {/* Common fields for both Student and Teacher */}
        {(formData.role_id === 2 || formData.role_id === 3) && (
          <>
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
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value as 'Laki-laki' | 'Perempuan'})}
                className="w-full rounded border p-2"
                required
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            {/* Other common fields */}
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
          </>
        )}

        {/* Teacher-specific fields */}
        {formData.role_id === 2 && (
          <>
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
              <label className="block text-sm font-medium mb-1">Specialization</label>
              <input
                type="text"
                value={formData.spesialisasi}
                onChange={e => setFormData({...formData, spesialisasi: e.target.value})}
                className="w-full rounded border p-2"
              />
            </div>
          </>
        )}

        {/* Student-specific fields */}
        {formData.role_id === 3 && (
          <>
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
              <label className="block text-sm font-medium mb-1">Class</label>
              <input
                type="text"
                value={formData.kelas}
                onChange={e => setFormData({...formData, kelas: e.target.value})}
                className="w-full rounded border p-2"
                required
              />
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-72 bg-white border-r border-[var(--border-color)] p-6 flex flex-col justify-between">
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
                <a className="sidebar-link active" href="#">
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
                  className="sidebar-link cursor-pointer" 
                  onClick={navigateToTeachers}
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
              <button 
                onClick={openCreateModal}
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[var(--primary-color)] text-white text-sm font-semibold leading-normal tracking-wide hover:bg-blue-600 transition-colors duration-200"
              >
                <span className="material-icons mr-2 text-lg">add</span>
                <span className="truncate">New User</span>
              </button>
              <a className="sidebar-link" href="#">
                <span className="material-icons">help_outline</span>
                <span className="text-sm">Help and Docs</span>
              </a>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 @container">
            <header className="mb-8">
              <h2 className="text-[var(--primary-text-color)] text-3xl font-bold leading-tight">Users</h2>
              <p className="text-[var(--secondary-text-color)] text-sm mt-1">Manage user accounts, roles, and access permissions.</p>
            </header>

            {/* Search Bar */}
            <div className="mb-6">
              <label className="relative flex items-center">
                <span className="material-icons absolute left-3 text-[var(--secondary-text-color)]">search</span>
                <input
                  type="search"
                  className="form-input w-full rounded-lg border border-[var(--border-color)] bg-[var(--background-color)] h-12 pl-10 pr-4 text-sm text-[var(--primary-text-color)] placeholder:text-[var(--secondary-text-color)] focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] transition-shadow duration-200"
                  placeholder="Search users by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-lg border border-[var(--border-color)] bg-white shadow-sm">
              {loading ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[var(--accent-color)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Password</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {displayedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{user.id}</td>
                        <td className="px-6 py-4 text-sm">{user.username}</td>
                        <td className="px-6 py-4 text-sm">{user.password}</td>
                        <td className="px-6 py-4 text-sm">{user.role.nama_role}</td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
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
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 rounded-md hover:bg-[var(--accent-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <span className="material-icons text-lg text-[var(--secondary-text-color)]">chevron_left</span>
                </button>
                <button 
                  className="p-2 rounded-md hover:bg-[var(--accent-color)]"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <span className="material-icons text-lg text-[var(--secondary-text-color)]">chevron_right</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Add User/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {isEditing ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full rounded border p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full rounded border p-2"
                    required={!isEditing}
                  />
                  {isEditing && (
                    <p className="text-sm text-gray-500 mt-1">
                      Leave blank to keep current password
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={formData.role_id}
                    onChange={e => setFormData({...formData, role_id: Number(e.target.value)})}
                    className="w-full rounded border p-2"
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="1">Admin</option>
                    <option value="2">Teacher</option>
                    <option value="3">Student</option>
                  </select>
                </div>
                {renderRoleFields()}
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
                  form="userForm"
                  onClick={handleSubmit}
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