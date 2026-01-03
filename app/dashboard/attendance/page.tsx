'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Save, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const router = useRouter();
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Helper API Instance
  const createApi = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/login');
        throw new Error('No token found');
    }
    return axios.create({
        baseURL: 'https://api.meccaschool.online/api/teacher',
        headers: { Authorization: `Bearer ${token}` }
    });
  }, [router]);

  // 1. Load Jadwal Guru
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const api = createApi();
        const res = await api.get('/schedules');
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setSchedules(data);
      } catch (error) {
        console.error("Gagal load jadwal", error);
      } finally {
        setLoadingInit(false);
      }
    };
    fetchSchedules();
  }, [createApi]);

  // 2. Load Data Siswa & Absensi
  const handleLoad = async () => {
    if (!selectedScheduleId) return;
    
    setLoadingData(true);
    setHasSearched(true);
    setAttendanceData([]);
    setStatusMap({});

    try {
        const api = createApi();
        // Panggil endpoint baru: getAttendanceByClass
        // Ini akan mengembalikan daftar SEMUA siswa di kelas tersebut + data absensi mereka hari ini (jika ada)
        const res = await api.get(`/attendance/${selectedScheduleId}`, {
            params: { date }
        });
        
        const students = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAttendanceData(students);

        // Initialize status map
        const initialMap: Record<number, string> = {};
        
        students.forEach((student: any) => {
            // Cek apakah siswa ini sudah punya data absensi hari ini
            // Backend biasanya mengembalikan dalam bentuk array "Attendances" atau objek tunggal "Attendance" 
            // tergantung relasi hasMany/hasOne. Kita handle keduanya.
            const attRecord = student.Attendances?.[0] || student.attendances?.[0] || student.Attendance || student.attendance;
            
            if (attRecord) {
                initialMap[student.id] = attRecord.status;
            } else {
                initialMap[student.id] = 'Present'; // Default hadir jika belum diabsen
            }
        });
        
        setStatusMap(initialMap);

    } catch (error: any) {
        console.error("Error load absensi:", error);
        alert(`Gagal memuat data: ${error.response?.data?.message || error.message}`);
    } finally {
        setLoadingData(false);
    }
  };

  // 3. Handle Perubahan Status (Radio Button)
  const handleStatusChange = (studentId: number, status: string) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  // 4. Submit Absensi (Simpan Semua)
  const handleSubmit = async () => {
    if (attendanceData.length === 0) return;
    
    setSaving(true);
    try {
        const api = createApi();
        
        // Kirim request simpan per siswa
        // (Bisa dioptimasi dengan bulk insert di backend, tapi loop request ini cukup aman untuk <40 siswa)
        const promises = Object.entries(statusMap).map(([studentIdStr, status]) => {
            const studentId = parseInt(studentIdStr);
            return api.post('/attendance', {
                scheduleId: parseInt(selectedScheduleId),
                studentId: studentId,
                status: status,
                date: date
            });
        });
        
        await Promise.all(promises);
        alert('Absensi berhasil disimpan!');
        
        // Refresh data untuk memastikan sinkronisasi
        handleLoad();
        
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan sebagian data.');
    } finally {
        setSaving(false);
    }
  };

  if (loadingInit) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
          <Loader2 className="w-8 h-8 mb-2 animate-spin text-blue-600" />
          <p>Memuat jadwal...</p>
      </div>
  );

  return (
    <div>
       <h1 className="text-2xl font-bold text-gray-800 mb-6">Input Absensi</h1>
       
       {/* FILTER SECTION */}
       <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-800">Pilih Sesi Jadwal</label>
              <select 
                  className="w-full border p-2.5 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={selectedScheduleId}
                  onChange={e => {
                      setSelectedScheduleId(e.target.value);
                      setHasSearched(false);
                  }}
              >
                  <option value="">-- Pilih Sesi --</option>
                  {schedules.map((s: any) => (
                      <option key={s.id} value={s.id}>
                          {s.day} ({s.startTime.slice(0,5)}) - {s.Class?.name} ({s.Subject?.name})
                      </option>
                  ))}
              </select>
          </div>
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-800">Tanggal</label>
              <input 
                  type="date" 
                  className="w-full border p-2.5 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={date}
                  onChange={e => setDate(e.target.value)}
              />
          </div>
          <button 
              onClick={handleLoad}
              disabled={!selectedScheduleId || loadingData}
              className="bg-blue-600 text-white font-semibold p-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center transition-all shadow-sm"
          >
              {loadingData ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buka Absensi'}
          </button>
       </div>

       {/* LOADING STATE */}
       {loadingData && (
           <div className="py-16 text-center bg-white rounded-xl border border-dashed text-gray-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 mb-2 animate-spin text-blue-400" />
                <p>Mengambil data siswa...</p>
           </div>
       )}

       {/* TABEL ABSENSI */}
       {!loadingData && attendanceData.length > 0 && (
           <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="text-sm text-gray-600 font-medium bg-white px-3 py-1.5 rounded border shadow-sm">
                       Total Siswa: <strong>{attendanceData.length}</strong>
                   </div>
                   <button 
                      onClick={handleSubmit}
                      disabled={saving}
                      className="w-full sm:w-auto bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95"
                   >
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                   </button>
               </div>

               <div className="overflow-x-auto">
                   <table className="w-full text-left">
                       <thead className="bg-gray-100 border-b">
                           <tr>
                               <th className="px-6 py-4 w-16 text-gray-600 font-semibold text-sm uppercase tracking-wider text-center">No</th>
                               <th className="px-6 py-4 text-gray-600 font-semibold text-sm uppercase tracking-wider">Nama Siswa</th>
                               <th className="px-6 py-4 text-center text-gray-600 font-semibold text-sm uppercase tracking-wider w-[400px]">Status Kehadiran</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {attendanceData.map((student: any, idx) => {
                               const currentStatus = statusMap[student.id];

                               return (
                                   <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                       <td className="px-6 py-4 text-gray-500 text-center font-medium">{idx + 1}</td>
                                       <td className="px-6 py-4 text-gray-800 font-medium">
                                           {student.name} <span className="block text-xs text-gray-400 font-mono mt-0.5">NIS: {student.nis}</span>
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="flex justify-center gap-2">
                                               {[
                                                   { val: 'Present', label: 'Hadir', activeColor: 'bg-green-100 text-green-700 border-green-300 ring-2 ring-green-200', baseColor: 'bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600' },
                                                   { val: 'Late', label: 'Telat', activeColor: 'bg-yellow-100 text-yellow-700 border-yellow-300 ring-2 ring-yellow-200', baseColor: 'bg-white text-gray-500 border-gray-200 hover:bg-yellow-50 hover:text-yellow-600' },
                                                   { val: 'Excused', label: 'Izin', activeColor: 'bg-blue-100 text-blue-700 border-blue-300 ring-2 ring-blue-200', baseColor: 'bg-white text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600' },
                                                   { val: 'Absent', label: 'Alpa', activeColor: 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-200', baseColor: 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600' },
                                               ].map((opt) => (
                                                   <button
                                                       key={opt.val}
                                                       onClick={() => handleStatusChange(student.id, opt.val)}
                                                       className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                                           currentStatus === opt.val ? opt.activeColor : opt.baseColor
                                                       }`}
                                                   >
                                                       {opt.label}
                                                   </button>
                                               ))}
                                           </div>
                                       </td>
                                   </tr>
                               );
                           })}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* FEEDBACK DATA KOSONG */}
       {!loadingData && hasSearched && attendanceData.length === 0 && (
           <div className="py-16 text-center bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-gray-500">
               <div className="bg-gray-100 p-4 rounded-full mb-3">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Siswa</h3>
               <p className="text-sm max-w-xs mx-auto mt-1">Belum ada siswa yang terdaftar di kelas jadwal ini.</p>
           </div>
       )}
    </div>
  );
}