'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type DayType = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

type Schedule = {
  id: number;
  kelas: string;
  hari: DayType;
  mapel_id: number;
  guru_id: number;
  jam_mulai: string;
  jam_selesai: string;
  // Join fields
  mata_pelajaran?: {
    nama_mapel: string;
  };
  guru?: {
    nama: string;
  };
};

type Subject = {
  id: number;
  nama_mapel: string;
  guru_id: number;
};

type ScheduleFormData = Omit<Schedule, 'id' | 'mata_pelajaran' | 'guru'>;

// Add new interface for subject form
interface SubjectFormData {
  nama_mapel: string;
  guru_id: number;
}

export default function SchedulesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [teachers, setTeachers] = useState<{ id: number; nama: string; }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<ScheduleFormData>({
    kelas: '',
    hari: 'Senin',
    mapel_id: 0,
    guru_id: 0,
    jam_mulai: '',
    jam_selesai: ''
  });
  const [subjectFormData, setSubjectFormData] = useState<SubjectFormData>({
    nama_mapel: '',
    guru_id: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const days: DayType[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jadwal_pelajaran')
        .select(`
          *,
          mata_pelajaran (
            nama_mapel
          ),
          guru (
            nama
          )
        `)
        .order('hari')
        .order('jam_mulai');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('mata_pelajaran')
        .select(`
          *,
          guru (
            nama
          )
        `)
        .order('nama_mapel');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('guru')
        .select('id, nama')
        .order('nama');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchSubjects();
    fetchTeachers();
  }, []);

  // CRUD operations
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const { error } = await supabase
        .from('jadwal_pelajaran')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSchedules(schedules.filter(s => s.id !== id));
      alert('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const handleCreate = async (data: ScheduleFormData) => {
    try {
      setIsSubmitting(true);

      // Validate inputs
      if (!data.kelas.trim()) {
        throw new Error('Class is required');
      }
      if (!data.mapel_id) {
        throw new Error('Subject is required');
      }
      if (!data.guru_id) {
        throw new Error('Teacher is required');
      }
      if (!data.jam_mulai || !data.jam_selesai) {
        throw new Error('Start and end time are required');
      }

      // Convert time strings to proper format (HH:mm:ss)
      const formattedStartTime = data.jam_mulai + ':00';
      const formattedEndTime = data.jam_selesai + ':00';

      // Create the schedule with properly formatted data
      const { data: newSchedule, error } = await supabase
        .from('jadwal_pelajaran')
        .insert([{
          kelas: data.kelas.trim(),
          hari: data.hari,
          mapel_id: data.mapel_id,
          guru_id: data.guru_id,
          jam_mulai: formattedStartTime,
          jam_selesai: formattedEndTime
        }])
        .select('*, mata_pelajaran(nama_mapel), guru(nama)')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!newSchedule) {
        throw new Error('Failed to create schedule - no data returned');
      }

      // Reset form data
      setFormData({
        kelas: '',
        hari: 'Senin',
        mapel_id: 0,
        guru_id: 0,
        jam_mulai: '',
        jam_selesai: ''
      });

      await fetchSchedules();
      setIsModalOpen(false);
      alert('Schedule created successfully');

    } catch (error) {
      console.error('Error creating schedule:', error);
      alert(error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, data: ScheduleFormData) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('jadwal_pelajaran')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      fetchSchedules();
      setIsModalOpen(false);
      alert('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      kelas: schedule.kelas,
      hari: schedule.hari,
      mapel_id: schedule.mapel_id,
      guru_id: schedule.guru_id,
      jam_mulai: schedule.jam_mulai,
      jam_selesai: schedule.jam_selesai
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedSchedule(null);
    setFormData({
      kelas: '',
      hari: 'Senin',
      mapel_id: 0,
      guru_id: 0,
      jam_mulai: '',
      jam_selesai: ''
    });
    setIsModalOpen(true);
  };

  // Update Schedule form validation in modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!formData.kelas.trim()) {
      alert('Class is required');
      return;
    }
    if (!formData.mapel_id) {
      alert('Subject is required');
      return;
    }
    if (!formData.jam_mulai || !formData.jam_selesai) {
      alert('Start and end time are required');
      return;
    }

    // Compare times to ensure end time is after start time
    const startTime = new Date(`2000-01-01T${formData.jam_mulai}`);
    const endTime = new Date(`2000-01-01T${formData.jam_selesai}`);
    if (endTime <= startTime) {
      alert('End time must be after start time');
      return;
    }

    if (isEditing && selectedSchedule) {
      handleUpdate(selectedSchedule.id, formData);
    } else {
      handleCreate(formData);
    }
  };

  // Add this function to get unique classes
  const getUniqueClasses = () => {
    const classes = new Set(schedules.map(schedule => schedule.kelas));
    return Array.from(classes).sort();
  };

  // Add this filtered schedules computation
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.mata_pelajaran?.nama_mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.guru?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = !classFilter || schedule.kelas === classFilter;
    const matchesDay = !dayFilter || schedule.hari === dayFilter;

    return matchesSearch && matchesClass && matchesDay;
  });

  // Add navigation functions
  const navigateToDashboard = () => router.push('/dashboard/admin');
  const navigateToUsers = () => router.push('/dashboard/admin/users');
  const navigateToStudents = () => router.push('/dashboard/admin/students');
  const navigateToTeachers = () => router.push('/dashboard/admin/teachers');

  // Update handleCreateSubject function
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validate inputs
      if (!subjectFormData.nama_mapel.trim()) {
        throw new Error('Subject name is required');
      }

      if (!subjectFormData.guru_id) {
        throw new Error('Please select a teacher');
      }

      // Create the subject
      const { data: newSubject, error } = await supabase
        .from('mata_pelajaran')
        .insert([{
          nama_mapel: subjectFormData.nama_mapel.trim(),
          guru_id: subjectFormData.guru_id
        }])
        .select('*, guru(nama)')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!newSubject) {
        throw new Error('Failed to create subject - no data returned');
      }

      // Reset form and refresh data
      setSubjectFormData({
        nama_mapel: '',
        guru_id: 0
      });
      await fetchSubjects();
      setIsSubjectModalOpen(false);
      alert('Subject created successfully');

    } catch (error) {
      console.error('Error creating subject:', error);
      alert(error instanceof Error ? error.message : 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1">
          {/* Add Sidebar */}
          <aside className="w-72 bg-white border-r border-[var(--border-color)] p-6 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <h1 className="text-[var(--primary-text-color)] text-xl font-bold leading-normal">
                Acme University
              </h1>
              <nav className="flex flex-col gap-2">
                <a className="sidebar-link cursor-pointer" onClick={navigateToDashboard}>
                  <span className="material-icons">dashboard</span>
                  <span className="text-sm">Dashboard</span>
                </a>
                <a className="sidebar-link cursor-pointer" onClick={navigateToUsers}>
                  <span className="material-icons">manage_accounts</span>
                  <span className="text-sm">Users</span>
                </a>
                <a className="sidebar-link cursor-pointer" onClick={navigateToStudents}>
                  <span className="material-icons">school</span>
                  <span className="text-sm">Students</span>
                </a>
                <a className="sidebar-link cursor-pointer" onClick={navigateToTeachers}>
                  <span className="material-icons">groups</span>
                  <span className="text-sm">Teachers</span>
                </a>
                <a className="sidebar-link active cursor-pointer">
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
                <span className="truncate">New Schedule</span>
              </button>
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-green-600 text-white text-sm font-semibold leading-normal tracking-wide hover:bg-green-700 transition-colors duration-200"
              >
                <span className="material-icons mr-2 text-lg">book</span>
                <span className="truncate">New Subject</span>
              </button>
              <a className="sidebar-link" href="#">
                <span className="material-icons">help_outline</span>
                <span className="text-sm">Help and Docs</span>
              </a>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8 @container">
            <header className="mb-8">
              <h2 className="text-3xl font-bold">Class Schedules</h2>
              <p className="text-gray-600">Manage school class schedules and assignments</p>
            </header>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
              <input
                type="search"
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded border p-2"
              />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-48 rounded border p-2"
              >
                <option value="">All Classes</option>
                {getUniqueClasses().map(kelas => (
                  <option key={kelas} value={kelas}>{kelas}</option>
                ))}
              </select>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-48 rounded border p-2"
              >
                <option value="">All Days</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Add filter tags */}
            {(classFilter || dayFilter) && (
              <div className="flex gap-2 mb-4">
                {classFilter && (
                  <span className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
                    Class: {classFilter}
                    <button 
                      onClick={() => setClassFilter('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </span>
                )}
                {dayFilter && (
                  <span className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
                    Day: {dayFilter}
                    <button 
                      onClick={() => setDayFilter('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Schedules Table */}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Class</th>
                    <th className="px-6 py-3 text-left">Day</th>
                    <th className="px-6 py-3 text-left">Subject</th>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Teacher</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4">{schedule.kelas}</td>
                      <td className="px-6 py-4">{schedule.hari}</td>
                      <td className="px-6 py-4">{schedule.mata_pelajaran?.nama_mapel}</td>
                      <td className="px-6 py-4">{`${schedule.jam_mulai} - ${schedule.jam_selesai}`}</td>
                      <td className="px-6 py-4">{schedule.guru?.nama}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => openEditModal(schedule)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <span className="material-icons">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Update the pagination info */}
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-[var(--secondary-text-color)]">
                Showing {filteredSchedules.length} of {schedules.length} schedules
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {isEditing ? 'Edit Schedule' : 'Create Schedule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select
                  value={formData.mapel_id}
                  onChange={e => {
                    const subject = subjects.find(s => s.id === Number(e.target.value));
                    setFormData({
                      ...formData, 
                      mapel_id: Number(e.target.value),
                      guru_id: subject?.guru_id || 0
                    });
                  }}
                  className="w-full rounded border p-2"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nama_mapel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <select
                  value={formData.hari}
                  onChange={e => setFormData({...formData, hari: e.target.value as DayType})}
                  className="w-full rounded border p-2"
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.jam_mulai}
                  onChange={e => setFormData({...formData, jam_mulai: e.target.value})}
                  className="w-full rounded border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.jam_selesai}
                  onChange={e => setFormData({...formData, jam_selesai: e.target.value})}
                  className="w-full rounded border p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subjectFormData.nama_mapel}
                  onChange={e => setSubjectFormData({...subjectFormData, nama_mapel: e.target.value})}
                  className="w-full rounded border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teacher</label>
                <select
                  value={subjectFormData.guru_id}
                  onChange={e => setSubjectFormData({...subjectFormData, guru_id: Number(e.target.value)})}
                  className="w-full rounded border p-2"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
