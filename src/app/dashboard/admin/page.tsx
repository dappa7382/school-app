'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Types matching your schema
type GenderEnum = 'Laki-laki' | 'Perempuan';
type SemesterEnum = 'Ganjil' | 'Genap';
type HariEnum = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

interface DashboardCounts {
  studentCount: number;
  teacherCount: number;
  classCount: number;
  subjectCount: number;
}

interface Activity {
  id: number;
  type: 'student' | 'teacher' | 'schedule' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  iconBg?: string;
  iconColor?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState<DashboardCounts>({
    studentCount: 0,
    teacherCount: 0,
    classCount: 0,
    subjectCount: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch counts from database
        const fetchCounts = async () => {
          const { data: students, error: studentsError } = await supabase
            .from('siswa')
            .select('id');
          
          if (studentsError) throw studentsError;

          const { data: teachers, error: teachersError } = await supabase
            .from('guru')
            .select('id');
          
          if (teachersError) throw teachersError;

          const { data: schedules, error: schedulesError } = await supabase
            .from('jadwal_pelajaran')
            .select('kelas');
          
          if (schedulesError) throw schedulesError;

          const { data: subjects, error: subjectsError } = await supabase
            .from('mata_pelajaran')
            .select('id');
          
          if (subjectsError) throw subjectsError;

          const uniqueClasses = [...new Set(schedules.map(item => item.kelas))];

          return {
            studentCount: students.length,
            teacherCount: teachers.length,
            classCount: uniqueClasses.length,
            subjectCount: subjects.length
          };
        };

        const counts = await fetchCounts();
        setCounts(counts);

        // Generate sample activities since there's no activities table in schema
        const sampleActivities: Activity[] = [
          {
            id: 1,
            type: 'student',
            title: 'New Student Registration',
            description: 'A new student has been registered',
            timestamp: new Date(),
            icon: 'user',
          },
          // Add more sample activities as needed
        ];

        setRecentActivities(sampleActivities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const navigateToSection = (section: string) => {
    router.push(`/dashboard/admin/${section}`);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden" 
         style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--border-color)] px-6 md:px-10 py-4 shadow-sm">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <div className="size-8 text-black">
              <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h1 className="text-[var(--text-primary)] text-2xl font-bold tracking-tight">School Admin</h1>
          </div>
          <div className="flex flex-1 justify-end items-center gap-8">
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-gray-300 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-transparent hover:border-black transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
              >
                <span className="sr-only">Open user menu</span>
              </div>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-black rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-white bg-black hover:bg-gray-800 transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-6 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-12 bg-slate-100">
          <div className="layout-content-container flex flex-col w-full max-w-6xl">
            {/* Welcome Section */}
            <div className="flex flex-wrap items-start gap-4 p-4 mb-10 border-b border-gray-300 pb-8">
              <div className="flex flex-col">
                <h2 className="text-[var(--text-primary)] tracking-tight text-4xl font-bold leading-tight">
                  Welcome Back, Admin!
                </h2>
                <p className="text-gray-500 mt-1 text-lg">
                  Here's an overview of your school's activities.
                </p>
              </div>
            </div>

            {/* Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-4">
              {/* Replace static cards with dynamic data */}
              {getManagementCards().map((card, index) => (
                <ManagementCard 
                  key={index}
                  {...card}
                  count={counts[card.countKey as keyof DashboardCounts]}
                  onClick={() => navigateToSection(card.section)}
                />
              ))}
            </div>

            {/* Recent Activity */}
            <div className="mt-10 bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
                Recent Activity
              </h3>
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <button className="btn btn-secondary mt-8 w-full md:w-auto hover:bg-black hover:text-white">
                <span className="truncate">View All Activities</span>
                <svg className="ml-2" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="16">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </main>

        <footer className="py-8 px-10 bg-white border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2025 School Admin Dashboard. All rights reserved. Crafted with care.
          </p>
        </footer>
      </div>
    </div>
  );
}

// Helper function to get management cards data
function getManagementCards() {
  return [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and access permissions.',
      icon: {
        path: 'M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z',
        viewBox: '0 0 256 256'
      },
      section: 'users',
      countKey: 'studentCount'
    },
    {
      title: 'Student Management',
      description: 'Manage student records, enrollment, and academic progress.',
      icon: {
        path: 'M224,64a8,8,0,0,1-8,8H192V88a8,8,0,0,1-16,0V72H152a8,8,0,0,1,0-16h24V40a8,8,0,0,1,16,0V56h24A8,8,0,0,1,224,64Zm-40,24a88.1,88.1,0,0,0-88-88A88.1,88.1,0,0,0,8,88c0,29.41,12.62,54.43,32,70.69V200a16,16,0,0,0,16,16H160a16,16,0,0,0,16-16V158.69c19.38-16.26,32-41.28,32-70.69Zm-16,0A72,72,0,1,1,32,88,72,72,0,0,1,168,88Z',
        viewBox: '0 0 256 256'
      },
      section: 'students',
      countKey: 'studentCount'
    },
    {
      title: 'Teacher Management',
      description: 'Oversee teacher profiles, classes, and performance evaluations.',
      icon: {
        path: 'M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a48,48,0,1,1-48-48A48.05,48.05,0,0,1,176,128Zm-48-32a32,32,0,1,0,32,32A32,32,0,0,0,128,96Z',
        viewBox: '0 0 256 256'
      },
      section: 'teachers',
      countKey: 'teacherCount'
    },
    {
      title: 'Schedule Management',
      description: 'Organize class schedules and teaching assignments.',
      icon: {
        path: 'M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM104,80a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H112A8,8,0,0,1,104,80Zm0,40a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H112A8,8,0,0,1,104,120Zm0,40a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H112A8,8,0,0,1,104,160ZM72,72a12,12,0,1,1-12,12A12,12,0,0,1,72,72Zm0,40a12,12,0,1,1-12,12A12,12,0,0,1,72,112Zm0,40a12,12,0,1,1-12,12A12,12,0,0,1,72,152Z',
        viewBox: '0 0 256 256'
      },
      section: 'schedules',
      countKey: 'schedulesCount'
    }
  ];
}

// Helper Components
const ManagementCard = ({ title, description, icon, count, onClick }: {
  title: string;
  description: string;
  icon: { path: string; viewBox: string };
  count: number;
  onClick: () => void;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col items-start transform hover:-translate-y-1 group">
    <div className="mb-4 p-3 rounded-full bg-gray-200 text-black group-hover:bg-black group-hover:text-white transition-colors duration-300">
      <svg fill="currentColor" height="32" viewBox={icon.viewBox} width="32">
        <path d={icon.path}></path>
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
    <p className="text-gray-600 text-sm mb-6 flex-grow">{description}</p>
    <button onClick={onClick} className="btn btn-primary mt-auto w-full">
      <span className="truncate">Manage {title.split(' ')[0]}</span>
    </button>
  </div>
);

// Helper component for activity items
const ActivityItem = ({ activity }: { activity: Activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'student':
        return (
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17 11l2 2 4-4" />
        );
      case 'teacher':
        return (
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
        );
      case 'schedule':
        return (
          <path d="M8 2v4 M16 2v4 M3 10h18 M21 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        );
      case 'system':
        return (
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
        );
      default:
        return null;
    }
  };

  const getIconClass = () => {
    switch (activity.type) {
      case 'system':
        return 'activity-icon activity-icon-alert';
      default:
        return 'activity-icon activity-icon-default';
    }
  };

  return (
    <div className="activity-item">
      <div className={getIconClass()}>
        <svg 
          fill="none" 
          height="24" 
          stroke="currentColor" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          width="24"
        >
          {getActivityIcon()}
        </svg>
      </div>
      <div>
        <p className="font-medium text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: activity.title }} />
        <p className="text-sm text-gray-500">
          {new Date(activity.timestamp).toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
};

