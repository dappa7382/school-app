'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Gender = 'Laki-laki' | 'Perempuan';
type Hari = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
type Semester = 'Ganjil' | 'Genap';

type SiswaType = {
  id: number;
  user_id: number;
  nis: string;
  nama: string;
  kelas: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  gender: Gender;
};

type MataPelajaranType = {
  id: number;
  nama_mapel: string;
  guru_id: number;
};

type JadwalType = {
  id: number;
  kelas: string;
  mapel_id: number;
  guru_id: number;
  hari: Hari;
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran: MataPelajaranType;
  guru: {
    id: number;
    nama: string;
  };
};

type NilaiType = {
  id: number;
  siswa_id: number;
  mapel_id: number;
  nilai: number;
  semester: Semester;
  tahun_ajar: string;
  mata_pelajaran: MataPelajaranType;
};

export default function SiswaDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SiswaType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [jadwal, setJadwal] = useState<JadwalType[]>([]);
  const [showNilai, setShowNilai] = useState(false);
  const [showJadwalLengkap, setShowJadwalLengkap] = useState(false);
  const [nilai, setNilai] = useState<NilaiType[]>([]);
  const [jadwalLengkap, setJadwalLengkap] = useState<JadwalType[]>([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const userCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user='));
        
        let user;
        try {
          user = userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
        } catch (e) {
          console.error('Error parsing user cookie:', e);
          router.push('/login');
          return;
        }

        if (!user?.id) {
          router.push('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('siswa')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          
          const today = new Date().getDay();
          const dayMap: Record<number, 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | undefined> = {
            1: 'Senin',
            2: 'Selasa',
            3: 'Rabu',
            4: 'Kamis',
            5: 'Jumat',
            6: 'Sabtu'
          };
          
          const currentDay = dayMap[today];
          
          if (currentDay) {
            const { data: jadwalData, error: jadwalError } = await supabase
              .from('jadwal_pelajaran')
              .select(`
                id,
                kelas,
                mapel_id,
                guru_id,
                hari,
                jam_mulai,
                jam_selesai,
                mata_pelajaran:mapel_id (
                  id,
                  nama_mapel,
                  guru_id
                ),
                guru:guru_id (
                  id,
                  nama
                )
              `)
              .eq('kelas', profileData.kelas)
              .eq('hari', currentDay)
              .order('jam_mulai');

            if (jadwalError) throw jadwalError;
            if (jadwalData) {
              setJadwal(
                (jadwalData as any[]).map((item) => ({
                  ...item,
                  mata_pelajaran: Array.isArray(item.mata_pelajaran) ? item.mata_pelajaran[0] : item.mata_pelajaran,
                  guru: Array.isArray(item.guru) ? item.guru[0] : item.guru,
                })) as JadwalType[]
              );
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setJadwal([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getCurrentDayName = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  const announcements = [
    {
      type: 'Important',
      title: 'Ujian Tengah Semester',
      content: 'UTS akan dilaksanakan pada tanggal 15-20 Maret 2025. Harap mempersiapkan diri dengan baik.',
      image: 'https://source.unsplash.com/800x400/?school,exam'
    },
    {
      type: 'Announcement',
      title: 'Lomba Karya Ilmiah',
      content: 'Pendaftaran lomba karya ilmiah tingkat nasional telah dibuka. Deadline pendaftaran 30 Maret 2024.',
      image: 'https://source.unsplash.com/800x400/?science,research'
    }
  ];

  const handleViewGrades = async () => {
    if (showNilai) {
      setShowNilai(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('nilai_siswa')
        .select(`
          *,
          mata_pelajaran (
            id,
            nama_mapel,
            guru_id
          )
        `)
        .eq('siswa_id', profile?.id);

      if (error) throw error;
      if (data) {
        setNilai(data);
        // Extract unique years from the data
        const years = [...new Set(data.map(n => n.tahun_ajar))];
        setAvailableYears(years);
        setShowNilai(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleViewSchedule = async () => {
    if (showJadwalLengkap) {
      setShowJadwalLengkap(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('jadwal_pelajaran')
        .select(`
          *,
          mata_pelajaran (
            id,
            nama_mapel,
            guru_id
          ),
          guru (
            id,
            nama
          )
        `)
        .eq('kelas', profile?.kelas)
        .order('hari')
        .order('jam_mulai');

      if (error) throw error;
      if (data) {
        setJadwalLengkap(data);
        setShowJadwalLengkap(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleViewDetail = () => setIsExpanded(!isExpanded);

  // Add handleSignOut function
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getFilteredNilai = () => {
    return nilai.filter((n) => {
      const matchesSemester = selectedSemester === 'all' || n.semester === selectedSemester;
      const matchesYear = selectedYear === 'all' || n.tahun_ajar === selectedYear;
      return matchesSemester && matchesYear;
    });
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <style jsx global>{`
        :root {
          --primary-color: #000000;
          --secondary-color: #F3F4F6;
          --accent-color: #4F46E5;
          --text-primary: #1F2937;
          --text-secondary: #6B7280;
          --border-color: #E5E7EB;
        }
        body {
          font-family: "Plus Jakarta Sans", "Noto Sans", sans-serif;
        }
        .icon-size {
          font-size: 1.5rem;
          line-height: 1.5rem;
        }
        @container (max-width: 500px) {
          .table-cell-room { display: none; }
        }
        @container (max-width: 400px) {
          .table-cell-time { display: none; }
        }
        @container (max-width: 768px) {
          .desktop-only { display: none; }
        }

        @container (min-width: 769px) {
          .mobile-only { display: none; }
        }
      `}</style>

      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--border-color)] px-4 sm:px-6 md:px-10 py-4 shadow-sm">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <div className="text-[var(--primary-color)]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard Siswa</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <span className="material-icons-outlined icon-size">menu</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-[var(--border-color)] hover:border-gray-400 transition-colors"
              >
                <span className="sr-only">Open user menu</span>
                <span className="material-icons-outlined text-gray-600">person</span>
              </button>
              
              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm text-white font-medium truncate">{profile?.nama}</p>
                    <p className="text-sm text-gray-300 truncate">NIS: {profile?.nis}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 md:px-10 flex flex-1 justify-center py-4 sm:py-8 bg-[var(--secondary-color)]">
          <div className="container mx-auto flex flex-col w-full max-w-6xl flex-1 gap-4 sm:gap-8">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : profile ? (
              <>
                <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg @container">
                  {/* Mobile View */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="bg-gray-200 aspect-square bg-cover rounded-full h-20 w-20 border-2 border-[var(--accent-color)] shadow-md flex items-center justify-center">
                          <span className="material-icons-outlined text-gray-400" style={{ fontSize: '6rem' }}>account_circle</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{profile?.nama}</h2>
                        <p className="text-[var(--text-secondary)] text-sm">NIS: {profile?.nis}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[var(--text-secondary)] text-sm">Kelas {profile?.kelas}</p>
                          <button
                            onClick={handleViewDetail}
                            className="text-[var(--accent-color)] text-sm font-medium hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? 'Show Less' : 'See More'}
                            <span className="material-icons-outlined text-base">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                    </div>
                    </div>
                    
                    {/* Mobile Expandable Detail Section */}
                    <div className={`mt-4 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="border-t border-[var(--border-color)] pt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Detail Informasi Siswa</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-[var(--text-secondary)]">NIS</p>
                                  <p className="mt-1 text-sm text-[var(--text-primary)]">{profile?.nis}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-[var(--text-secondary)]">Kelas</p>
                                  <p className="mt-1 text-sm text-[var(--text-primary)]">Kelas {profile?.kelas}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>                    {/* Desktop View */}
                    <div className="hidden md:block">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-6">
                          <div className="shrink-0">
                            <div className="bg-gray-200 aspect-square bg-cover rounded-full h-32 w-32 border-2 border-[var(--accent-color)] shadow-md flex items-center justify-center">
                              <span className="material-icons-outlined text-gray-400" style={{ fontSize: '10rem' }}>account_circle</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h2 className="text-[var(--text-primary)] text-2xl font-bold">{profile?.nama}</h2>
                                <div className="mt-1 flex flex-col gap-1">
                                  <p className="text-[var(--text-secondary)]">NIS: {profile?.nis}</p>
                                  <p className="text-[var(--text-secondary)]">Kelas {profile?.kelas}</p>
                                  <button
                                    onClick={handleViewDetail}
                                    className="text-[var(--accent-color)] text-sm font-medium hover:underline flex items-center gap-1 mt-2"
                                  >
                                    {isExpanded ? 'Show Less' : 'See More'}
                                    <span className="material-icons-outlined text-base">
                                      {isExpanded ? 'expand_less' : 'expand_more'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                    {/* Expandable Detail Section */}
                    <div className={`mt-6 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="border-t border-[var(--border-color)] pt-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Detail Informasi Siswa</h4>
                            <div className="bg-gray-50 rounded-lg p-6">
                              <table className="w-full">
                                <tbody className="divide-y divide-gray-200">
                                  <tr>
                                    <td className="py-3 text-sm text-[var(--text-secondary)] w-1/3">NIS</td>
                                    <td className="py-3 text-sm text-[var(--text-primary)] font-medium">{profile?.nis}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-3 text-sm text-[var(--text-secondary)]">Nama Lengkap</td>
                                    <td className="py-3 text-sm text-[var(--text-primary)] font-medium">{profile?.nama}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-3 text-sm text-[var(--text-secondary)]">Kelas</td>
                                    <td className="py-3 text-sm text-[var(--text-primary)] font-medium">Kelas {profile?.kelas}</td>
                                  </tr>

                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[var(--text-primary)] text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight mb-1">
                        Today's Schedule
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        {getCurrentDayName()}
                      </p>
                    </div>
                  </div>
                  <div className="@container">
                    {/* Mobile View */}
                    <div className="md:hidden">
                      {jadwal.length > 0 ? (
                        <div className="grid gap-4">
                          {jadwal.map((j) => (
                            <div key={j.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="text-sm text-[var(--text-secondary)]">
                                    {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                  </p>
                                  <h4 className="font-medium text-[var(--text-primary)]">
                                    {j.mata_pelajaran.nama_mapel}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="size-8 rounded-full bg-white flex items-center justify-center">
                                  <span className="material-icons-outlined text-[#6B7280] text-base">person</span>
                                </div>
                                <span className="text-sm text-[var(--text-secondary)]">{j.guru.nama}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--text-secondary)]">
                          No classes scheduled for {getCurrentDayName().toLowerCase()}
                        </div>
                      )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                      <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase tracking-wider">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase tracking-wider">Subject</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase tracking-wider">Teacher</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB]">
                            {jadwal.length > 0 ? (
                              jadwal.map((j) => (
                                <tr key={j.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-[#1F2937] whitespace-nowrap">
                                      {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                      <span className="text-sm text-[#1F2937] font-medium">
                                        {j.mata_pelajaran.nama_mapel}
                                      </span>
                                      <span className="text-xs text-[var(--text-secondary)]">
                                        Kelas {j.kelas}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="size-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                                        <span className="material-icons-outlined text-[#6B7280] text-base">person</span>
                                      </div>
                                      <span className="text-sm text-[var(--text-secondary)]">{j.guru.nama}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
                                  No classes scheduled for {getCurrentDayName().toLowerCase()}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                  <h3 className="text-[var(--text-primary)] text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={handleViewGrades}
                      className="flex items-center justify-center gap-2 h-12 px-4 bg-[var(--primary-color)] text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <span className="material-icons-outlined">
                        {showNilai ? 'close' : 'assessment'}
                      </span>
                      <span>{showNilai ? 'Close Grades' : 'View Grades'}</span>
                    </button>
                    
                    <button 
                      onClick={handleViewSchedule}
                      className="flex items-center justify-center gap-2 h-12 px-4 bg-[var(--secondary-color)] text-[var(--text-primary)] text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-[var(--border-color)]"
                    >
                      <span className="material-icons-outlined">
                        {showJadwalLengkap ? 'close' : 'import_contacts'}
                      </span>
                      <span>{showJadwalLengkap ? 'Close Schedule' : 'Schedules'}</span>
                    </button>
                  </div>
                  
                  {showNilai && (
                    <div className="rounded-lg border border-[#E5E7EB] overflow-hidden mt-4">
                      {/* Filter Controls - More Mobile Friendly */}
                      <div className="bg-gray-50 p-4 border-b border-[#E5E7EB]">
                        <div className="flex flex-col gap-3">
                          <h4 className="text-[#1F2937] font-semibold">Nilai Akademik</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={selectedSemester}
                              onChange={(e) => setSelectedSemester(e.target.value as Semester | 'all')}
                              className="w-full border rounded px-3 py-2 text-sm"
                            >
                              <option value="all">Semua Semester</option>
                              <option value="Ganjil">Ganjil</option>
                              <option value="Genap">Genap</option>
                            </select>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(e.target.value)}
                              className="w-full border rounded px-3 py-2 text-sm"
                            >
                              <option value="all">Semua Tahun</option>
                              {availableYears.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden">
                        {getFilteredNilai().map((n) => (
                          <div key={n.id} className="p-4 border-b border-[#E5E7EB]">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium text-[var(--text-primary)]">{n.mata_pelajaran.nama_mapel}</h5>
                                <p className="text-sm text-[var(--text-secondary)]">{n.semester} - {n.tahun_ajar}</p>
                              </div>
                              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                                {n.nilai}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:block">
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Mata Pelajaran</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Nilai</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Semester</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Tahun</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                              {getFilteredNilai().map((n) => (
                                <tr key={n.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-[#1F2937]">{n.mata_pelajaran.nama_mapel}</td>
                                  <td className="px-4 py-3 text-sm text-[#1F2937] font-medium">{n.nilai}</td>
                                  <td className="px-4 py-3 text-sm text-[#6B7280]">{n.semester}</td>
                                  <td className="px-4 py-3 text-sm text-[#6B7280]">{n.tahun_ajar}</td>
                                </tr>
                              ))}
                              {getFilteredNilai().length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-8 text-center text-[#6B7280] text-sm">
                                    Tidak ada nilai yang sesuai dengan filter
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {showJadwalLengkap && (
                    <div className="rounded-lg border border-[#E5E7EB] overflow-hidden mt-4">
                      <div className="bg-gray-50 px-4 py-3 border-b border-[#E5E7EB]">
                        <h4 className="text-[#1F2937] text-sm font-semibold">Jadwal Kelas {profile?.kelas}</h4>
                      </div>

                      {/* Mobile View */}
                      <div className="md:hidden">
                        {jadwalLengkap.map((j) => (
                          <div key={j.id} className="p-4 border-b border-[#E5E7EB]">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium text-[var(--text-primary)]">{j.mata_pelajaran.nama_mapel}</h5>
                                <p className="text-sm text-[var(--text-secondary)]">{j.hari}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="size-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                                <span className="material-icons-outlined text-[#6B7280] text-base">person</span>
                              </div>
                              <span className="text-sm text-[var(--text-secondary)]">{j.guru.nama}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Hari</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Waktu</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Mata Pelajaran</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Guru</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB]">
                            {jadwalLengkap.map((j) => (
                              <tr key={j.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-[#1F2937]">{j.hari}</td>
                                <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">
                                  {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                </td>
                                <td className="px-4 py-3 text-sm text-[#1F2937]">{j.mata_pelajaran.nama_mapel}</td>
                                <td className="px-4 py-3 text-sm text-[#6B7280]">{j.guru.nama}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                <section className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                  <h3 className="text-[var(--text-primary)] text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight mb-4 sm:mb-6">School Updates</h3>
                  <div className="space-y-4 sm:space-y-6">
                    {announcements.map((announcement, index) => (
                      <div key={index} className="flex flex-col gap-3 p-3 sm:p-4 border border-[var(--border-color)] rounded-lg hover:shadow-md transition-shadow">
                        <div className="w-full flex flex-col gap-1">
                          <p className={`${announcement.type === 'Important' ? 'text-[#4F46E5]' : 'text-green-600'} text-xs font-semibold uppercase tracking-wider`}>
                            {announcement.type}
                          </p>
                          <h4 className="text-[#1F2937] text-base sm:text-lg font-semibold leading-tight">{announcement.title}</h4>
                          <p className="text-[#6B7280] text-sm font-normal leading-relaxed">{announcement.content}</p>
                        </div>
                        <div 
                          className="w-full aspect-video bg-center bg-no-repeat bg-cover rounded-md" 
                          style={{ backgroundImage: `url("${announcement.image}")` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="text-center">No data available</div>
            )}
          </div>
        </main>

        <footer className="text-center py-4 sm:py-6 border-t border-[var(--border-color)] bg-[var(--secondary-color)]">
          <p className="text-sm text-[var(--text-secondary)]">© 2025 CampusConnect. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
