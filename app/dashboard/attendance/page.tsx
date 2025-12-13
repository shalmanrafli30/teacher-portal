'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Save, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function AttendancePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Tambahan state untuk feedback jika jadwal kosong
  const [hasSearched, setHasSearched] = useState(false);

  // 1. Load Jadwal Guru
  useEffect(() => {
    api.get('/teacher/schedules').then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setSchedules(data);
    });
  }, []);

  // 2. Load Data Absensi
  const handleLoad = async () => {
    if (!selectedScheduleId) return;
    setLoading(true);
    setHasSearched(true); // Tandai sudah mencari
    setAttendanceData([]); // Reset tabel

    try {
        // Coba ambil data absensi yang SUDAH TERSIMPAN dulu
        const res = await api.get(`/teacher/attendance/${selectedScheduleId}?date=${date}`);
        let data = Array.isArray(res.data) ? res.data : res.data.data || [];

        // Jika data kosong (artinya belum pernah absen hari ini), ambil daftar siswa dari kelas
        if (data.length === 0) {
            
            // Cari jadwal yang dipilih dari state local
            const schedule = schedules.find(s => s.id === parseInt(selectedScheduleId));
            
            // --- PERBAIKAN DI SINI ---
            // Gunakan schedule.classId (bukan schedule.Class.id)
            if (schedule && schedule.classId) {
                console.log("Mengambil siswa dari Class ID:", schedule.classId);
                
                const resStudents = await api.get(`/teacher/class/${schedule.classId}/students`);
                const students = resStudents.data.data || resStudents.data || [];
                
                if (students.length === 0) {
                    alert("Tidak ada siswa di kelas ini.");
                }

                // Format data agar mirip struktur tabel Attendance
                data = students.map((s: any) => ({
                    studentId: s.id,
                    Student: s, 
                    status: 'Present' // Default hadir
                }));
            } else {
                console.error("Data jadwal tidak memiliki classId yang valid", schedule);
            }
        }

        setAttendanceData(data);
        
        // Initialize status map (radio button)
        const initialMap: any = {};
        data.forEach((item: any) => {
            // Priority: item.status (dari DB) -> 'Present' (Default)
            initialMap[item.studentId || item.Student.id] = item.status || 'Present'; 
        });
        setStatusMap(initialMap);

    } catch (error: any) {
        console.error("Error load absensi:", error);
        alert(`Gagal memuat data: ${error.response?.data?.message || error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (attendanceData.length === 0) return;
    setSaving(true);
    try {
        const promises = Object.entries(statusMap).map(([studentId, status]) => {
            return api.post('/teacher/attendance', {
                scheduleId: parseInt(selectedScheduleId),
                studentId: parseInt(studentId),
                status: status,
                date: date
            });
        });
        await Promise.all(promises);
        alert('Absensi berhasil disimpan!');
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan sebagian data.');
    } finally {
        setSaving(false);
    }
  };

  return (
    <div>
       <h1 className="text-2xl font-bold text-gray-800 mb-6">Input Absensi</h1>
       
       <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-800">Pilih Sesi Jadwal</label>
              <select 
                  className="w-full border p-2 rounded text-gray-800"
                  value={selectedScheduleId}
                  onChange={e => {
                      setSelectedScheduleId(e.target.value);
                      setHasSearched(false); // Reset tabel kalau ganti jadwal
                  }}
              >
                  <option value="">-- Pilih Sesi --</option>
                  {schedules.map((s: any) => (
                      <option key={s.id} value={s.id}>
                          {s.day} ({s.startTime.slice(0,5)}) - {s.Subject?.name} - Kelas {s.Class?.name}
                      </option>
                  ))}
              </select>
          </div>
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-800">Tanggal</label>
              <input 
                  type="date" 
                  className="w-full border p-2 rounded text-gray-800"
                  value={date}
                  onChange={e => setDate(e.target.value)}
              />
          </div>
          <button 
              onClick={handleLoad}
              disabled={!selectedScheduleId || loading}
              className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900 disabled:bg-gray-300 min-w-30"
          >
              {loading ? 'Loading...' : 'Buka Absensi'}
          </button>
       </div>

       {/* FEEDBACK SAAT LOADING */}
       {loading && (
           <div className="text-center py-10 text-gray-500 bg-white border border-dashed rounded-xl">
               Sedang memuat data siswa...
           </div>
       )}

       {/* TABEL ABSENSI */}
       {!loading && attendanceData.length > 0 && (
           <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
               <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                   <span className="text-sm text-gray-500 font-medium">
                       Total Siswa: {attendanceData.length}
                   </span>
                   <button 
                      onClick={handleSubmit}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 disabled:bg-green-300 flex items-center"
                   >
                      <Save className="w-4 h-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                   </button>
               </div>
               <table className="w-full text-left">
                   <thead className="bg-gray-100 border-b">
                       <tr>
                           <th className="px-6 py-3 text-gray-800">Nama Siswa</th>
                           <th className="px-6 py-3 text-center text-gray-800">Hadir</th>
                           <th className="px-6 py-3 text-center text-gray-800">Sakit/Izin</th>
                           <th className="px-6 py-3 text-center text-gray-800">Terlambat</th>
                           <th className="px-6 py-3 text-center text-gray-800">Alpa</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y">
                       {attendanceData.map((item: any) => {
                           const student = item.Student; 
                           const sId = item.studentId || student.id;
                           const currentStatus = statusMap[sId];

                           return (
                               <tr key={sId} className="hover:bg-gray-50">
                                   <td className="px-6 py-3 text-gray-500">
                                       <span className='font-medium'>{student.name}</span>  <br/>
                                       <span className="text-xs text-gray-500">{student.nis}</span>
                                   </td>
                                   {['Present', 'Excused', 'Late', 'Absent'].map(statusOption => (
                                       <td key={statusOption} className="px-6 py-3 text-center">
                                           <div className="flex justify-center">
                                                <input 
                                                    type="radio"
                                                    name={`status-${sId}`}
                                                    checked={currentStatus === statusOption}
                                                    onChange={() => handleStatusChange(sId, statusOption)}
                                                    className="w-5 h-5 text-blue-600 accent-blue-600 cursor-pointer"
                                                />
                                           </div>
                                       </td>
                                   ))}
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           </div>
       )}
        
       {/* FEEDBACK JIKA DATA KOSONG SETELAH SEARCH */}
       {!loading && hasSearched && attendanceData.length === 0 && (
           <div className="text-center py-10 text-gray-500 bg-white border border-dashed rounded-xl">
               <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
               <p>Tidak ada siswa ditemukan di sesi jadwal ini.</p>
           </div>
       )}
    </div>
  );
}