'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User, Briefcase, Award, Loader2, Calendar, Clock, BookOpen, CheckSquare, BarChart } from 'lucide-react';

interface TeacherProfile {
  id: number;
  nip: string;
  name: string;
  subjectSpecialization: string;
}

interface Schedule {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  Class?: {
    name: string;
  };
  Subject?: {
    name: string;
  };
}

export default function TeacherDashboard() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  // Helper Hari
  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    const todayName = getDayName(date.getDay());

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const api = axios.create({
          baseURL: 'https://api.meccaschool.online/api/teacher',
          headers: { Authorization: `Bearer ${token}` }
        });

        // 1. Get Profile
        const resProfile = await api.get('/profile'); 
        const profileData = resProfile.data.data || resProfile.data;
        setProfile(profileData);

        // 2. Get Schedules (Untuk Widget Jadwal Hari Ini)
        const resSchedule = await api.get('/schedules');
        const scheduleData = Array.isArray(resSchedule.data.data) ? resSchedule.data.data : (Array.isArray(resSchedule.data) ? resSchedule.data : []);

        // Filter Jadwal Hari Ini
        const todays = scheduleData
            .filter((s: Schedule) => s.day === todayName)
            .sort((a: Schedule, b: Schedule) => a.startTime.localeCompare(b.startTime));

        setTodaySchedules(todays);

      } catch (error) {
        console.error('Gagal mengambil data dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-10 h-10 mb-2 animate-spin text-blue-600" />
        <p>Memuat dashboard...</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
             Halo, <span className="text-blue-600">{profile?.name?.split(' ')[0] || 'Guru'}</span>! 👋
           </h1>
           <p className="text-gray-500 mt-1">Selamat datang di Portal Guru.</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-full shadow-sm border flex items-center text-sm text-gray-600 w-fit">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            {currentDate}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI (2/3): Profil & Menu */}
        <div className="lg:col-span-2 space-y-6">
             {/* Card Profil */}
             <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 transition-all hover:shadow-md">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 border-4 border-blue-50">
                  <User className="w-10 h-10 md:w-14 md:h-14" />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{profile?.name || 'Guru Pengajar'}</h2>
                  <p className="text-gray-500 text-sm mt-1">NIP: {profile?.nip || '-'}</p>
                  
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-100">
                      <Briefcase className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Spesialisasi: {profile?.subjectSpecialization || 'Umum'}</span>
                  </div>
                </div>
              </div>
              
              {/* Menu Cepat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div onClick={() => router.push('/dashboard/grades')} className="p-5 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition group">
                      <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition">
                        <BarChart className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Input Nilai</span>
                  </div>
                   <div onClick={() => router.push('/dashboard/attendance')} className="p-5 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-400 hover:shadow-md transition group">
                      <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition">
                        <CheckSquare className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Absensi Kelas</span>
                  </div>
                   <div onClick={() => router.push('/dashboard/schedule')} className="p-5 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-yellow-400 hover:shadow-md transition group">
                      <div className="p-3 bg-gray-50 rounded-full">
                        <BookOpen className="w-6 h-6 text-yellow-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Jadwal Lengkap</span>
                  </div>
              </div>
        </div>

        {/* KOLOM KANAN (1/3): Jadwal Hari Ini */}
        <div className="space-y-6">
            {/* Widget Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-1">Semangat Mengajar!</h3>
                    <p className="text-blue-100 text-sm">
                        "Guru terbaik adalah guru yang tak kenal lelah mencari cara agar muridnya mengerti."
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                    <User className="w-32 h-32" />
                </div>
            </div>

            {/* Widget Jadwal */}
            <div className="bg-white rounded-2xl shadow-sm border p-5 h-fit">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        Jadwal Hari Ini
                    </h3>
                </div>
                
                <div className="space-y-3">
                    {todaySchedules.length > 0 ? (
                      todaySchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-start p-3 rounded-xl bg-blue-50 border border-blue-100 transition hover:shadow-sm">
                            <div className="bg-white text-blue-700 text-xs font-bold px-2 py-1.5 rounded-lg border border-blue-100 mr-3 shrink-0 text-center min-w-[55px]">
                                {schedule.startTime.slice(0, 5)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-800 truncate">{schedule.Subject?.name || 'Mata Pelajaran'}</p>
                                <div className="flex items-center mt-1">
                                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5">
                                        Kelas {schedule.Class?.name || '?'}
                                    </span>
                                </div>
                            </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">Tidak ada jadwal mengajar hari ini.</p>
                          <p className="text-[10px] mt-1">Silakan persiapkan materi.</p>
                      </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}