'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Gender = 'Laki-laki' | 'Perempuan';
type Hari = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
type Semester = 'Ganjil' | 'Genap';

type GuruType = {
  id: number;
  user_id: number;
  nip: string;
  nama: string;
  spesialisasi: string | null;
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
};

type NilaiType = {
  id: number;
  siswa_id: number;
  mapel_id: number;
  nilai: number;
  semester: Semester;
  tahun_ajar: string;
  siswa: {
    id: number;
    nama: string;
    nis: string;
    kelas: string;
  };
  mata_pelajaran: MataPelajaranType;
};

type EditNilaiType = {
  id?: number;
  siswa_id: number;
  mapel_id: number;
  nilai: number;
  semester: Semester;
  tahun_ajar: string;
};

export default function GuruDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GuruType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [jadwal, setJadwal] = useState<JadwalType[]>([]);
  const [showJadwalLengkap, setShowJadwalLengkap] = useState(false);
  const [jadwalLengkap, setJadwalLengkap] = useState<JadwalType[]>([]);
  const [selectedDay, setSelectedDay] = useState<Hari | ''>('');
  const [nilaiSiswa, setNilaiSiswa] = useState<NilaiType[]>([]);
  const [showNilai, setShowNilai] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [selectedTahun, setSelectedTahun] = useState<string>('2023/2024');
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingNilai, setEditingNilai] = useState<EditNilaiType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState<number>(0);
  const [availableMapel, setAvailableMapel] = useState<{id: number, nama_mapel: string}[]>([]);
  const [availableSiswa, setAvailableSiswa] = useState<{id: number, nama: string, nis: string, kelas: string}[]>([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const announcements = [
    {
      type: 'Important',
      title: 'Rapat Guru',
      content: 'Rapat evaluasi semester akan dilaksanakan pada tanggal 20 Maret 2024 pukul 13.00 WIB.',
      image: 'https://source.unsplash.com/800x400/?meeting,teacher'
    },
    {
      type: 'Announcement',
      title: 'Pelatihan Kurikulum',
      content: 'Workshop implementasi kurikulum baru akan diadakan tanggal 25-26 Maret 2024.',
      image: 'https://source.unsplash.com/800x400/?training,education'
    }
  ];

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
          .from('guru')
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
          const dayMap: Record<number, Hari | undefined> = {
            1: 'Senin',
            2: 'Selasa',
            3: 'Rabu',
            4: 'Kamis',
            5: 'Jumat',
            6: 'Sabtu'
          };
          
          const currentDay = dayMap[today];
          
          if (currentDay) {
            const { data: jadwalData } = await supabase
              .from('jadwal_pelajaran')
              .select(`
                *,
                mata_pelajaran (
                  id,
                  nama_mapel,
                  guru_id
                )
              `)
              .eq('guru_id', profileData.id)
              .eq('hari', currentDay)
              .order('jam_mulai');

            if (jadwalData) setJadwal(jadwalData);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  const handleViewSchedule = async () => {
    try {
      let query = supabase
        .from('jadwal_pelajaran')
        .select(`
          id,
          kelas,
          mapel_id,
          guru_id,
          hari,
          jam_mulai,
          jam_selesai,
          mata_pelajaran (
            id,
            nama_mapel,
            guru_id
          )
        `)
        .eq('guru_id', profile?.id);

      // Hanya tambahkan filter hari jika ada hari yang dipilih
      if (selectedDay) {
        query = query.eq('hari', selectedDay);
      }

      // Tetap urutkan berdasarkan hari dan jam
      query = query.order('hari').order('jam_mulai');
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching schedule:', error);
        return;
      }

      if (data) {
        const fixedData = data.map((item: any) => ({
          ...item,
          mata_pelajaran: Array.isArray(item.mata_pelajaran) 
            ? item.mata_pelajaran[0] 
            : item.mata_pelajaran,
        }));
        setJadwalLengkap(fixedData);
        setShowNilai(false);
        setShowJadwalLengkap(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleViewGrades = async () => {
    try {
      const { data: mapelData } = await supabase
        .from('mata_pelajaran')
        .select('id')
        .eq('guru_id', profile?.id);

      if (!mapelData?.length) return;

      const mapelIds = mapelData.map((m: { id: number }) => m.id);

      const { data: nilaiData } = await supabase
        .from('nilai_siswa')
        .select(`
          id,
          siswa_id,
          mapel_id,
          nilai,
          semester,
          tahun_ajar,
          siswa:siswa_id (
            id,
            nama,
            nis,
            kelas
          ),
          mata_pelajaran:mapel_id (
            id,
            nama_mapel,
            guru_id
          )
        `)
        .in('mapel_id', mapelIds)
        .eq('semester', selectedSemester)
        .eq('tahun_ajar', selectedTahun);

      if (nilaiData) {
        // Fix: Map siswa and mata_pelajaran from array to object
        const fixedData = nilaiData.map((n: any) => ({
          ...n,
          siswa: Array.isArray(n.siswa) ? n.siswa[0] : n.siswa,
          mata_pelajaran: Array.isArray(n.mata_pelajaran) ? n.mata_pelajaran[0] : n.mata_pelajaran,
        }));
        const filteredData = selectedKelas 
          ? fixedData.filter((n: any) => n.siswa.kelas === selectedKelas)
          : fixedData;
        setNilaiSiswa(filteredData);
        setShowNilai(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Move fetchKelasList function definition here
  const fetchKelasList = async () => {
    if (profile?.id) {
      const { data: jadwalData } = await supabase
        .from('jadwal_pelajaran')
        .select('kelas')
        .eq('guru_id', profile.id);

      if (jadwalData) {
        const uniqueKelas = [...new Set(jadwalData.map((item: { kelas: string }) => item.kelas))];
        setKelasList(uniqueKelas.sort() as string[]);
      }
    }
  };

  // Combine both effects into one
  useEffect(() => {
    if (profile?.id) {
      fetchKelasList();
      handleViewGrades();
    }
  }, [profile]);

  // Add new useEffect for automatic filtering
  useEffect(() => {
    if (showNilai && profile?.id) {
      handleViewGrades();
    }
  }, [selectedKelas, selectedSemester, selectedTahun]);

  // Helper functions
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
  
  const sortHari = (hari: Hari[]) => {
    const hariOrder: Record<Hari, number> = {
      'Senin': 0,
      'Selasa': 1,
      'Rabu': 2,
      'Kamis': 3,
      'Jumat': 4,
      'Sabtu': 5
    };
    return [...hari].sort((a, b) => hariOrder[a] - hariOrder[b]);
  };

  // Add CRUD handlers
  const handleAddNilai = () => {
    setIsEditMode(false);
    setEditingNilai({
      siswa_id: 0,
      mapel_id: selectedMapel,
      nilai: 0,
      semester: selectedSemester,
      tahun_ajar: selectedTahun
    });
    setShowModal(true);
  };

  const handleEditNilai = (nilai: NilaiType) => {
    setIsEditMode(true);
    setEditingNilai({
      id: nilai.id,
      siswa_id: nilai.siswa_id,
      mapel_id: nilai.mapel_id,
      nilai: nilai.nilai,
      semester: nilai.semester,
      tahun_ajar: nilai.tahun_ajar
    });
    setShowModal(true);
  };

  const handleDeleteNilai = async (id: number) => {
    if (confirm('Are you sure you want to delete this grade?')) {
      const { error } = await supabase
        .from('nilai_siswa')
        .delete()
        .eq('id', id);

      if (!error) {
        handleViewGrades();
      }
    }
  };

  const handleSaveNilai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNilai) return;

    if (isEditMode) {
      const { error } = await supabase
        .from('nilai_siswa')
        .update({
          nilai: editingNilai.nilai,
          semester: editingNilai.semester,
          tahun_ajar: editingNilai.tahun_ajar
        })
        .eq('id', editingNilai.id);

      if (!error) {
        handleViewGrades();
        setShowModal(false);
      }
    } else {
      const { error } = await supabase
        .from('nilai_siswa')
        .insert([editingNilai]);

      if (!error) {
        handleViewGrades();
        setShowModal(false);
      }
    }
  };

  // Add fetch functions for dropdowns
  useEffect(() => {
    const fetchMapel = async () => {
      const { data } = await supabase
        .from('mata_pelajaran')
        .select('id, nama_mapel')
        .eq('guru_id', profile?.id);
      
      if (data) {
        setAvailableMapel(data);
        if (data.length > 0) setSelectedMapel(data[0].id);
      }
    };

    const fetchSiswa = async () => {
      const { data } = await supabase
        .from('siswa')
        .select('id, nama, nis, kelas, gender')
        .order('nama');
      
      if (data) {
        // Filter siswa based on selected class if needed
        const filteredSiswa = selectedKelas 
          ? data.filter((s: any) => s.kelas === selectedKelas)
          : data;
        
        setAvailableSiswa(filteredSiswa);
      }
    };

    if (profile?.id) {
      fetchMapel();
      fetchSiswa();
    }
  }, [profile?.id, selectedKelas]);

  // Add handleSignOut function
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
      `}</style>

      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--border-color)] px-4 sm:px-6 md:px-10 py-4 shadow-sm">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <div className="text-black">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard Guru</h1>
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
                    <p className="text-sm text-gray-300 truncate">NIP: {profile?.nip}</p>
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
                {/* Profile Section */}
                <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex w-full flex-col gap-6 @[600px]:flex-row @[600px]:justify-between @[600px]:items-center">
                      <div className="flex items-center gap-6">
                        <div className="bg-gray-200 aspect-square bg-cover rounded-full h-20 w-20 border-2 border-[var(--accent-color)] shadow-md flex items-center justify-center">
                          <span className="material-icons-outlined text-gray-400" style={{ fontSize: '6rem' }}>account_circle</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <h2 className="text-[#1F2937] text-2xl md:text-3xl font-bold leading-tight tracking-tight">{profile.nama}</h2>
                          <p className="text-[#6B7280] text-sm md:text-base font-normal leading-normal">NIP: {profile.nip}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[#6B7280] text-sm md:text-base font-normal leading-normal">{profile.spesialisasi || 'Guru'}</p>
                            <button 
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="text-[#4F46E5] hover:text-indigo-700 text-xs font-medium leading-normal transition-colors flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Show Less' : 'See More'}</span>
                              <span className={`material-icons-outlined icon-size text-sm transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                arrow_forward_ios
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Profile Details */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                    <div className="p-6 border-t border-[#E5E7EB] bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[#6B7280]">Nama Lengkap</p>
                          <p className="text-[#1F2937] font-medium">{profile.nama}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#6B7280]">NIP</p>
                          <p className="text-[#1F2937] font-medium">{profile.nip}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#6B7280]">Spesialisasi</p>
                          <p className="text-[#1F2937] font-medium">{profile.spesialisasi || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#6B7280]">Gender</p>
                          <p className="text-[#1F2937] font-medium">{profile.gender}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">Tempat, Tanggal Lahir</p>
                          <p className="mt-1 text-sm text-[var(--text-primary)]">
                            {profile?.tempat_lahir}{profile?.tempat_lahir && profile?.tanggal_lahir ? ', ' : ''}
                            {profile?.tanggal_lahir ? new Date(profile.tanggal_lahir).toLocaleDateString('id-ID') : ''}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6B7280]">Alamat</p>
                          <p className="text-[#1F2937] font-medium">{profile.alamat || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Today's Schedule */}
                <section className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#1F2937] text-xl md:text-2xl font-bold leading-tight tracking-tight">
                      Today's Schedule
                    </h3>
                    <p className="text-[#6B7280] text-sm font-medium">
                      {getCurrentDayName()}
                    </p>
                  </div>
                  <div className="@container">
                    {/* Mobile View */}
                    <div className="md:hidden">
                      {jadwal.length > 0 ? (
                        jadwal.map((j) => (
                          <div key={j.id} className="p-4 border border-[#E5E7EB] rounded-lg mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[#1F2937] text-sm font-medium whitespace-nowrap">
                                {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                              </span>
                              <span className="bg-gray-100 text-[#1F2937] px-2 py-1 rounded text-sm">
                                Kelas {j.kelas}
                              </span>
                            </div>
                            <div className="text-[#1F2937] text-sm font-medium">
                              {j.mata_pelajaran.nama_mapel}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[#6B7280] text-sm">
                          No classes scheduled for {getCurrentDayName().toLowerCase()}
                        </div>
                      )}
                    </div>

                    {/* Desktop View - Existing table code */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E5E7EB]">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="table-cell-time w-1/5 px-4 py-3 text-left text-[#1F2937] text-xs sm:text-sm font-semibold uppercase tracking-wider">Time</th>
                            <th className="table-cell-course w-2/5 px-4 py-3 text-left text-[#1F2937] text-xs sm:text-sm font-semibold uppercase tracking-wider">Subject</th>
                            <th className="table-cell-room w-2/5 px-4 py-3 text-left text-[#1F2937] text-xs sm:text-sm font-semibold uppercase tracking-wider">Class</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {jadwal.length > 0 ? (
                            jadwal.map((j) => (
                              <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-[#1F2937] text-sm font-medium whitespace-nowrap">
                                  {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="text-[#1F2937] text-sm font-medium">
                                      {j.mata_pelajaran.nama_mapel}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[#6B7280] text-sm">Kelas {j.kelas}</span>
                                </td>
                              </tr>
                            ))
                          ):(
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-[#6B7280] text-sm">
                                No classes scheduled for {getCurrentDayName().toLowerCase()}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Quick Actions */}
                <section className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-[#1F2937] text-xl md:text-2xl font-bold leading-tight tracking-tight mb-4">Quick Actions</h3>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => {
                          if (showNilai) {
                            setShowNilai(false);
                          } else {
                            handleViewGrades();
                          }
                        }}
                        className={`w-full flex items-center justify-center gap-2 cursor-pointer overflow-hidden rounded-lg h-12 px-4 ${showNilai ? 'bg-gray-800' : 'bg-black'} text-white text-sm font-semibold leading-normal tracking-wide hover:bg-gray-800 transition-colors`}
                      >
                        <span className="material-icons-outlined icon-size text-base">grade</span>
                        <span className="truncate">{showNilai ? 'Tutup Nilai Siswa' : 'Lihat Nilai Siswa'}</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (showJadwalLengkap) {
                            setShowJadwalLengkap(false);
                          } else {
                            handleViewSchedule();
                          }
                        }}
                        className={`w-full flex items-center justify-center gap-2 cursor-pointer overflow-hidden rounded-lg h-12 px-4 ${showJadwalLengkap ? 'bg-gray-300' : 'bg-[#F3F4F6]'} text-[#1F2937] text-sm font-semibold leading-normal tracking-wide hover:bg-gray-200 transition-colors border border-[#E5E7EB]`}
                      >
                        <span className="material-icons-outlined icon-size text-base">import_contacts</span>
                        <span className="truncate">{showJadwalLengkap ? 'Schedules' : 'Schedules'}</span>
                      </button>
                    </div>

                    {showNilai && (
                      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-[#E5E7EB]">
                          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                              <h4 className="text-[#1F2937] text-sm font-semibold">Nilai Siswa</h4>
                              <button
                                onClick={handleAddNilai}
                                className="px-3 py-1 bg-[#4F46E5] text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                              >
                                + Add Nilai
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">
                              <select
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm"
                              >
                                <option value="">Semua Kelas</option>
                                {kelasList.map((kelas) => (
                                  <option key={kelas} value={kelas}>Kelas {kelas}</option>
                                ))}
                              </select>
                              <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm"
                              >
                                <option value="Ganjil">Semester Ganjil</option>
                                <option value="Genap">Semester Genap</option>
                              </select>
                              <select
                                value={selectedTahun}
                                onChange={(e) => setSelectedTahun(e.target.value)}
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm"
                              >
                                <option value="2023/2024">2023/2024</option>
                                <option value="2024/2025">2024/2025</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          {/* Mobile View */}
                          <div className="md:hidden">
                            {nilaiSiswa.map((n) => (
                              <div key={n.id} className="p-4 border-b border-[#E5E7EB]">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="font-semibold text-[#1F2937]">{n.siswa.nama}</h5>
                                  <span className="bg-gray-100 text-[#1F2937] px-2 py-1 rounded text-sm font-semibold">
                                    Nilai: {n.nilai}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                  <div>
                                    <p className="text-gray-500">NIS</p>
                                    <p>{n.siswa.nis}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Kelas</p>
                                    <p>{n.siswa.kelas}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-500">Mata Pelajaran</p>
                                    <p>{n.mata_pelajaran.nama_mapel}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Semester</p>
                                    <p>{n.semester}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Tahun</p>
                                    <p>{n.tahun_ajar}</p>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                  <button
                                    onClick={() => handleEditNilai(n)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNilai(n.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                            {nilaiSiswa.length === 0 && (
                              <div className="p-8 text-center text-[#6B7280]">
                                No grades available
                              </div>
                            )}
                          </div>
                          
                          {/* Desktop View */}
                          <table className="w-full hidden md:table">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Nama Siswa</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">NIS</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Kelas</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Mata Pelajaran</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Nilai</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Semester</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                              {nilaiSiswa.map((n) => (
                                <tr key={n.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-[#1F2937] font-medium">{n.siswa.nama}</td>
                                  <td className="px-4 py-3 text-sm text-[#6B7280]">{n.siswa.nis}</td>
                                  <td className="px-4 py-3 text-sm text-[#6B7280]">{n.siswa.kelas}</td>
                                  <td className="px-4 py-3 text-sm text-[#1F2937] font-medium">{n.mata_pelajaran.nama_mapel}</td>
                                  <td className="px-4 py-3 text-sm text-[#1F2937] font-medium">{n.nilai}</td>
                                  <td className="px-4 py-3 text-sm text-[#6B7280]">{n.semester} {n.tahun_ajar}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditNilai(n)}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNilai(n.id)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {nilaiSiswa.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="px-4 py-8 text-center text-[#6B7280] text-sm">
                                    No grades available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {showJadwalLengkap && (
                      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-[#E5E7EB]">
                          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <h4 className="text-[#1F2937] text-sm font-semibold">Jadwal Mengajar</h4>
                            <div className="w-full sm:w-auto flex items-center gap-2">
                              <label htmlFor="day-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter hari:</label>
                              <select
                                id="day-filter"
                                value={selectedDay}
                                onChange={(e) => {
                                  const newDay = e.target.value as Hari | '';
                                  setSelectedDay(newDay);
                                  handleViewSchedule(); // Langsung panggil tanpa setTimeout
                                }}
                                className="flex-1 px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm"
                              >
                                <option value="">Semua Hari</option>
                                {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as Hari[]).map((hari) => (
                                  <option key={hari} value={hari}>{hari}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          {/* Mobile View */}
                          <div className="md:hidden">
                            {jadwalLengkap.length > 0 ? (
                              jadwalLengkap.map((j) => (
                                <div key={j.id} className="p-4 border-b border-[#E5E7EB]">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-[#1F2937]">{j.hari}</h5>
                                    <span className="bg-gray-100 text-[#1F2937] px-2 py-1 rounded text-sm font-semibold">
                                      Kelas {j.kelas}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                                    <div>
                                      <p className="text-gray-500">Mata Pelajaran</p>
                                      <p className="font-medium">{j.mata_pelajaran.nama_mapel}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Waktu</p>
                                      <p>{formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-[#6B7280]">
                                {selectedDay ? `No classes scheduled for ${selectedDay}` : 'No classes scheduled'}
                              </div>
                            )}
                          </div>
                          
                          {/* Desktop View */}
                          <table className="w-full hidden md:table">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Hari</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Waktu</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Mata Pelajaran</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F2937] uppercase">Kelas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                              {jadwalLengkap.length > 0 ? (
                                jadwalLengkap.map((j) => (
                                  <tr key={j.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-[#1F2937]">{j.hari}</td>
                                    <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">
                                      {formatTime(j.jam_mulai)} - {formatTime(j.jam_selesai)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#1F2937]">{j.mata_pelajaran.nama_mapel}</td>
                                    <td className="px-4 py-3 text-sm text-[#6B7280]">Kelas {j.kelas}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-4 py-8 text-center text-[#6B7280] text-sm">
                                    {selectedDay 
                                      ? `No classes scheduled for ${selectedDay}` 
                                      : 'No classes scheduled'}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* School Updates section */}
                <section className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-[#1F2937] text-xl md:text-2xl font-bold leading-tight tracking-tight mb-6">School Updates</h3>
                  <div className="space-y-6">
                    {announcements.map((announcement, index) => (
                      <div key={index} className="flex flex-col md:flex-row items-start gap-4 p-4 border border-[#E5E7EB] rounded-lg hover:shadow-md transition-shadow">
                        <div className="w-full md:w-2/3 flex flex-col gap-1">
                          <p className={`${announcement.type === 'Important' ? 'text-[#4F46E5]' : 'text-green-600'} text-xs font-semibold uppercase tracking-wider`}>
                            {announcement.type}
                          </p>
                          <h4 className="text-[#1F2937] text-lg font-semibold leading-tight">{announcement.title}</h4>
                          <p className="text-[#6B7280] text-sm font-normal leading-relaxed">{announcement.content}</p>
                        </div>
                        <div 
                          className="w-full md:w-1/3 bg-center bg-no-repeat aspect-video bg-cover rounded-md" 
                          style={{ backgroundImage: `url("${announcement.image}")` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </section>

                <footer className="text-center py-6 border-t border-[#E5E7EB] bg-[#F3F4F6]">
          <p className="text-sm text-[#6B7280]">© 2024 CampusConnect. All rights reserved.</p>
        </footer>
              </>
            ) : (
              <div className="text-center">No data available</div>
            )}
          </div>
        </main>

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditMode ? 'Edit Nilai' : 'Add Nilai'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSaveNilai} className="space-y-4">
                {!isEditMode && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Siswa</label>
                      <select
                        value={editingNilai?.siswa_id || ''}
                        onChange={(e) => setEditingNilai(prev => ({...prev!, siswa_id: Number(e.target.value)}))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                        required
                      >
                        <option value="">Pilih Siswa</option>
                        {availableSiswa.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nama} - {s.nis} (Kelas {s.kelas})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
                      <select
                        value={editingNilai?.mapel_id || ''}
                        onChange={(e) => setEditingNilai(prev => ({...prev!, mapel_id: Number(e.target.value)}))}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                        required
                      >
                        {availableMapel.map(m => (
                          <option key={m.id} value={m.id}>{m.nama_mapel}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Nilai</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingNilai?.nilai || ''}
                    onChange={(e) => setEditingNilai(prev => ({...prev!, nilai: Number(e.target.value)}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
