'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, UserX, Inbox, Loader2 } from 'lucide-react';

export default function InputGradesPage() {
  const router = useRouter();
  
  // --- STATE DATA ---
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // --- STATE SELECTION ---
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [gradeType, setGradeType] = useState('UH1');
  
  // --- STATE PROCESSING ---
  const [students, setStudents] = useState<any[]>([]);
  const [inputGrades, setInputGrades] = useState<Record<number, number>>({});
  
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // 1. Load Data Awal (Jadwal Mengajar)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = createApi();
        const res = await api.get('/schedules'); 
        const rawData = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAllSchedules(rawData); 

        const uniqueClasses = new Map();
        rawData.forEach((s: any) => {
          if (s.Class && s.classId) {
            uniqueClasses.set(s.classId, { id: s.classId, name: s.Class.name }); 
          }
        });

        const classList = Array.from(uniqueClasses.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setClasses(classList);
      } catch (error) {
        console.error("Gagal load data awal", error);
      } finally {
        setLoadingInit(false);
      }
    };
    fetchData();
  }, [createApi]);

  // 2. Load Students & Grades (LOGIKA UTAMA)
  const fetchStudentsAndGrades = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId) return;

    setLoadingStudents(true);
    setInputGrades({}); // Reset tampilan input sementara loading

    try {
      const api = createApi();
      console.log(`📡 Fetching data... Class: ${selectedClassId}, Subject: ${selectedSubjectId}, Type: ${gradeType}`);
      
      // Request ke endpoint untuk ambil siswa + nilai
      const res = await api.get(`/students/${selectedClassId}`, {
        params: {
            subjectId: selectedSubjectId,
            type: gradeType
        }
      });
      
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      console.log("📦 Data received from API:", data); 

      setStudents(data);

      // Mapping Nilai Lama ke Input Form
      const existingGrades: Record<number, number> = {};
      
      data.forEach((student: any) => {
        // Cek properti Grades (bisa jadi 'Grades', 'grades', atau 'Grade' tergantung asosiasi sequelize)
        const gradesData = student.Grades || student.grades || student.Grade || [];
        
        // Karena di backend sudah difilter by type, array ini isinya spesifik nilai yg dicari
        if (Array.isArray(gradesData) && gradesData.length > 0) {
            const gradeRecord = gradesData[0]; 
            if (gradeRecord && gradeRecord.score !== undefined) {
                existingGrades[student.id] = gradeRecord.score;
            }
        }
      });
      
      console.log("✅ Mapped Grades:", existingGrades);
      setInputGrades(existingGrades);

    } catch (error) {
      console.error("❌ Error fetching students:", error);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId, selectedSubjectId, gradeType, createApi]);

  // 3. Efek Otomatis: Load data setiap kali filter berubah (Auto Reload)
  useEffect(() => {
    if (selectedClassId && selectedSubjectId && gradeType) {
        fetchStudentsAndGrades();
    }
  }, [selectedClassId, selectedSubjectId, gradeType, fetchStudentsAndGrades]);

  // 4. Handle Ganti Kelas
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(''); 
    setStudents([]);          
    setInputGrades({});       

    if (!classId) {
      setSubjects([]); 
      return;
    }

    const filteredSchedules = allSchedules.filter((s: any) => s.classId === parseInt(classId));
    const uniqueSubjects = new Map();
    filteredSchedules.forEach((s: any) => {
        if (s.Subject && s.subjectId) {
            uniqueSubjects.set(s.subjectId, { id: s.subjectId, name: s.Subject.name });
        }
    });

    const subjectList = Array.from(uniqueSubjects.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
    setSubjects(subjectList);
  };

  // 5. Handle Input Nilai Change
  const handleScoreChange = (id: number, val: string) => {
     const num = parseFloat(val);
     // Validasi: Boleh kosong, atau angka 0-100
     if (val === '' || (!isNaN(num) && num >= 0 && num <= 100)) {
         const copy = { ...inputGrades };
         if (val === '') delete copy[id];
         else copy[id] = num;
         setInputGrades(copy);
     }
  };
  
  // 6. Submit Data
  const handleSubmit = async () => {
      if (!selectedSubjectId) return alert('Pilih Mapel dulu');
      const entries = Object.entries(inputGrades);
      if (entries.length === 0) return alert('Belum ada nilai diisi');
      
      setSaving(true);
      try {
          const api = createApi();
          // Kirim request simpan (Backend akan handle create/update)
          await Promise.all(entries.map(([studentId, score]) => {
              return api.post('/grades', {
                  studentId: parseInt(studentId),
                  subjectId: parseInt(selectedSubjectId),
                  type: gradeType,
                  score
              });
          }));
          alert('Berhasil menyimpan nilai!');
          fetchStudentsAndGrades(); // Refresh data agar sinkron
      } catch (err) { 
          console.error(err);
          alert('Gagal menyimpan nilai.'); 
      }
      finally { setSaving(false); }
  };

  if (loadingInit) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
          <Loader2 className="w-8 h-8 mb-2 animate-spin text-blue-600" />
          <p>Memuat data kelas...</p>
      </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai Siswa</h1>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        {/* DROPDOWN KELAS */}
        <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Kelas Ajar</label>
            <select 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                value={selectedClassId} 
                onChange={(e) => handleClassChange(e.target.value)} 
            >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>

        {/* DROPDOWN MAPEL */}
        <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mata Pelajaran</label>
            <select 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400" 
                value={selectedSubjectId} 
                onChange={e => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId} 
            >
                <option value="">-- Pilih Mapel --</option>
                {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
        </div>

        {/* DROPDOWN TIPE NILAI */}
        <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Jenis Nilai</label>
            <select 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                value={gradeType} 
                onChange={e => setGradeType(e.target.value)}
            >
                <option value="UH1">Ulangan Harian 1</option>
                <option value="UH2">Ulangan Harian 2</option>
                <option value="UTS">UTS</option>
                <option value="UAS">UAS</option>
                <option value="Tugas">Tugas</option>
                <option value="Quiz">Quiz</option>
            </select>
        </div>
        
        {/* Indikator Loading Kecil */}
        <div className="flex items-center justify-center pb-2">
            {loadingStudents ? (
                <div className="flex items-center text-blue-600 text-sm font-medium animate-pulse">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memuat Data...
                </div>
            ) : null}
        </div>
      </div>

      {/* --- TABEL SISWA --- */}
      {!loadingStudents && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-4 bg-blue-50/50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center text-blue-800 text-sm font-medium bg-blue-100 px-3 py-1.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2"/> 
                    Nilai untuk <strong>{gradeType}</strong>
                 </div>
                 <button 
                    onClick={handleSubmit} 
                    disabled={saving} 
                    className="w-full sm:w-auto bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95"
                 >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                 </button>
             </div>

             <div className="overflow-x-auto">
                 <table className="w-full text-left">
                     <thead className="bg-gray-100 border-b">
                         <tr>
                             <th className="px-6 py-3 text-gray-600 w-16 text-center">No</th>
                             <th className="px-6 py-3 text-gray-600">Nama Siswa</th>
                             <th className="px-6 py-3 text-gray-600 text-center w-32">Nilai</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {students.map((s: any, idx) => (
                             <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-3 text-gray-500 text-center">{idx + 1}</td>
                                 <td className="px-6 py-3 text-gray-800 font-medium">
                                    {s.name} 
                                    <span className="text-xs text-gray-400 block font-normal">{s.nis}</span>
                                 </td>
                                 <td className="px-6 py-3 text-center">
                                    <input 
                                        type="number" 
                                        placeholder="-" 
                                        min="0"
                                        max="100"
                                        className="w-24 text-center border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 placeholder-gray-300"
                                        value={inputGrades[s.id] !== undefined ? inputGrades[s.id] : ''} 
                                        onChange={(e) => handleScoreChange(s.id, e.target.value)} 
                                    />
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {/* Empty State: Tidak ada siswa */}
      {!loadingStudents && students.length === 0 && selectedClassId && selectedSubjectId && (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-gray-500">
             <div className="bg-gray-100 p-4 rounded-full mb-3">
                <UserX className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Siswa</h3>
             <p className="text-sm max-w-xs mx-auto mt-1">Belum ada data siswa di kelas ini.</p>
          </div>
      )}

      {/* Initial State: Belum pilih kelas */}
      {!selectedClassId && (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed text-gray-400 flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
                <Inbox className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-600">Siap Input Nilai</h3>
            <p className="text-sm mt-1 max-w-md mx-auto">Silakan pilih Kelas dan Mata Pelajaran di atas untuk memulai.</p>
          </div>
      )}
    </div>
  );
}