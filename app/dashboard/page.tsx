'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User, Briefcase, Award, Loader2 } from 'lucide-react';

interface TeacherProfile {
  id: number;
  nip: string;
  name: string;
  subjectSpecialization: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Setup Axios dengan Token
        const api = axios.create({
          baseURL: 'https://api.meccaschool.online/api/teacher', // Endpoint Teacher Service
          headers: { Authorization: `Bearer ${token}` }
        });

        // Request Profile
        const res = await api.get('/profile'); 
        const data = res.data.data || res.data;
        setProfile(data);

      } catch (error) {
        console.error('Gagal mengambil profil guru', error);
        // Jika 401 Unauthorized, mungkin token expired -> redirect login
        // router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-10 h-10 mb-2 animate-spin text-blue-600" />
        <p>Memuat profil guru...</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Dashboard Guru</h1>
      
      {/* Card Profil */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 max-w-4xl transition-all hover:shadow-md">
        
        {/* Avatar */}
        <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 border-4 border-blue-50">
          <User className="w-10 h-10 md:w-14 md:h-14" />
        </div>

        {/* Info */}
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{profile?.name || 'Guru Pengajar'}</h2>
          <p className="text-gray-500 text-sm mt-1">Selamat datang kembali, mari mengajar dengan semangat!</p>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <Award className="w-5 h-5 mr-2" />
                <span className="font-semibold text-sm">NIP: {profile?.nip || '-'}</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-100">
                <Briefcase className="w-5 h-5 mr-2" />
                <span className="font-semibold text-sm">Spesialisasi: {profile?.subjectSpecialization || 'Umum'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder untuk Menu/Fitur Lain (Absensi, Nilai, dll) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 h-32 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
              + Menu Jadwal Mengajar
          </div>
          <div className="p-6 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 h-32 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
              + Menu Input Nilai
          </div>
          <div className="p-6 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 h-32 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer">
              + Menu Absensi
          </div>
      </div>

    </div>
  );
}