'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, Briefcase, Award, Loader2 } from 'lucide-react';

interface TeacherProfile {
  id: number;
  nip: string;
  name: string;
  subjectSpecialization: string;
}

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Asumsi endpoint profile guru. Jika belum ada, gunakan /teacher/profile
    api.get('/teacher/profile') 
       .then((res) => {
          const data = res.data.data || res.data;
          setProfile(data);
       })
       .catch((err) => console.error(err))
       .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading profil...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Guru</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 max-w-3xl">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <User className="w-10 h-10" />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">{profile?.name || 'Guru'}</h2>
          <div className="mt-2 space-y-1 text-gray-600">
            <div className="flex items-center justify-center md:justify-start">
                <Award className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">NIP:</span> <span className="ml-1">{profile?.nip || '-'}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start">
                <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">Spesialisasi:</span> <span className="ml-1">{profile?.subjectSpecialization || 'Umum'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}