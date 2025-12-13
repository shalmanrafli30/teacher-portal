'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

interface Schedule {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  // Sesuai models/index.js (tanpa alias)
  Class?: { name: string };
  Subject?: { name: string };
}

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesuai controller: exports.getMySchedules
    api.get('/teacher/schedules') // Sesuaikan route backend Anda
       .then((res) => {
         const data = Array.isArray(res.data) ? res.data : res.data.data || [];
         setSchedules(data);
       })
       .catch(console.error)
       .finally(() => setLoading(false));
  }, []);

  // Grouping hari
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped = daysOrder.reduce((acc, day) => {
    const items = schedules.filter(s => s.day === day);
    if (items.length) {
      items.sort((a, b) => a.startTime.localeCompare(b.startTime));
      acc[day] = items;
    }
    return acc;
  }, {} as Record<string, Schedule[]>);

  const formatTime = (t: string) => t?.slice(0, 5) || '--:--';
  const translateDay = (d: string) => {
    const map: any = { Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu' };
    return map[d] || d;
  };

  if (loading) return <div className="p-8 text-center">Loading jadwal...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Calendar className="mr-3 text-blue-600" /> Jadwal Mengajar
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 font-bold text-blue-800">
              {translateDay(day)}
            </div>
            <div className="p-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                  <div className="bg-gray-100 px-3 py-2 rounded text-center mr-4 min-w-20">
                    <Clock className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                    <span className="text-sm font-bold text-gray-700">{formatTime(item.startTime)}</span>
                    <div className="text-xs text-gray-500">{formatTime(item.endTime)}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1 text-blue-500" />
                      {item.Subject?.name}
                    </h4>
                    <div className="text-sm text-gray-600 mt-1 flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-green-500" />
                      Kelas {item.Class?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}