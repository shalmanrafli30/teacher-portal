'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Save, Search, AlertCircle, UserX, Inbox } from 'lucide-react';

export default function InputGradesPage() {
  // --- STATE DATA ---
  const [allSchedules, setAllSchedules] = useState<any[]>([]); // Menyimpan DATA MENTAH semua jadwal
  const [classes, setClasses] = useState<any[]>([]);           // Opsi Dropdown Kelas
  const [subjects, setSubjects] = useState<any[]>([]);         // Opsi Dropdown Mapel (Berubah sesuai kelas)
  
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
  const [hasSearched, setHasSearched] = useState(false);

  // 1. Load Data Awal (Hanya Isi Dropdown Kelas)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/teacher/schedules');
        const rawData = Array.isArray(res.data) ? res.data : res.data.data || [];
        
        // Simpan data mentah untuk filtering nanti
        setAllSchedules(rawData); 

        // Ekstrak Kelas Unik (Untuk Dropdown Pertama)
        const uniqueClasses = new Map();
        rawData.forEach((s: any) => {
          if (s.Class && s.classId) {
            uniqueClasses.set(s.classId, { id: s.classId, name: s.Class.name }); 
          }
        });

        // Set Opsi Kelas
        const classList = Array.from(uniqueClasses.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setClasses(classList);
        
      } catch (error) {
        console.error("Gagal load data awal", error);
      } finally {
        setLoadingInit(false);
      }
    };
    fetchData();
  }, []);

  // 2. Handle Ganti Kelas (Filter Mapel Otomatis)
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(''); // Reset mapel terpilih
    setHasSearched(false);    // Reset status pencarian
    setStudents([]);          // Kosongkan tabel siswa
    setInputGrades({});       // Kosongkan input nilai

    if (!classId) {
      setSubjects([]); // Kalau pilih "-- Pilih Kelas --", kosongkan mapel
      return;
    }

    // --- LOGIKA FILTERING MAPEL ---
    // Cari semua jadwal yang punya classId sesuai pilihan
    const filteredSchedules = allSchedules.filter((s: any) => s.classId === parseInt(classId));
    
    // Ekstrak Mapel Unik dari jadwal yang sudah difilter
    const uniqueSubjects = new Map();
    filteredSchedules.forEach((s: any) => {
        if (s.Subject && s.subjectId) {
            uniqueSubjects.set(s.subjectId, { id: s.subjectId, name: s.Subject.name });
        }
    });

    // Update Dropdown Mapel
    const subjectList = Array.from(uniqueSubjects.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
    setSubjects(subjectList);
  };

  // 3. Load Students & Grades (UPDATE DI SINI)
  const handleLoadStudents = async () => {
    if (!selectedClassId) return;
    
    // Validasi: Harus pilih mapel dulu biar tahu nilai mana yang mau diambil
    if (!selectedSubjectId) {
        alert("Mohon pilih Mata Pelajaran terlebih dahulu.");
        return;
    }

    setLoadingStudents(true);
    setHasSearched(true);
    setInputGrades({}); // Reset dulu
    setStudents([]);

    try {
      // Panggil API dengan Query Params subjectId & type
      const res = await api.get(`/teacher/class/${selectedClassId}/students`, {
        params: {
            subjectId: selectedSubjectId,
            type: gradeType
        }
      });
      
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setStudents(data);

      // --- LOGIKA MAPPING NILAI LAMA ---
      const existingGrades: Record<number, number> = {};
      
      data.forEach((student: any) => {
        // Cek apakah siswa punya Grades (dari include Backend tadi)
        // Backend Sequelize biasanya return array: student.Grades = [{ score: 90 }]
        if (student.Grades && student.Grades.length > 0) {
            // Ambil nilai pertama (karena filter subject & type spesifik, harusnya cuma 1)
            existingGrades[student.id] = student.Grades[0].score;
        }
      });
      
      setInputGrades(existingGrades); // Masukkan ke state input
      // ---------------------------------

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 4. Handle Input Nilai
  const handleScoreChange = (id: number, val: string) => {
     const num = parseFloat(val);
     if (!isNaN(num) && num >= 0 && num <= 100) {
         setInputGrades(prev => ({ ...prev, [id]: num }));
     } else if (val === '') {
         const copy = { ...inputGrades };
         delete copy[id];
         setInputGrades(copy);
     }
  };
  
  // 5. Submit
  const handleSubmit = async () => {
      if (!selectedSubjectId) return alert('Pilih Mapel dulu');
      const entries = Object.entries(inputGrades);
      if (entries.length === 0) return alert('Belum ada nilai diisi');
      
      setSaving(true);
      try {
          await Promise.all(entries.map(([studentId, score]) => {
              return api.post('/teacher/grades', {
                  studentId: parseInt(studentId),
                  subjectId: parseInt(selectedSubjectId),
                  type: gradeType,
                  score
              });
          }));
          alert('Berhasil disimpan!');
      } catch (err) { alert('Gagal simpan'); }
      finally { setSaving(false); }
  };

  if (loadingInit) return <div className="p-8 text-center text-gray-500">Menyiapkan data kelas...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Input Nilai</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        {/* DROPDOWN KELAS */}
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Kelas Ajar</label>
            <select 
                className="w-full border p-2 rounded text-gray-800" 
                value={selectedClassId} 
                onChange={(e) => handleClassChange(e.target.value)} // Pakai fungsi baru ini
            >
                <option value="" className='text-gray-800'>-- Pilih Kelas --</option>
                {classes.map((c: any) => (
                    <option key={c.id} value={c.id} className='text-gray-800'>{c.name}</option>
                ))}
            </select>
        </div>

        {/* DROPDOWN MAPEL (Isinya tergantung Kelas) */}
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Mata Pelajaran</label>
            <select 
                className="w-full border p-2 rounded disabled:bg-gray-100 text-gray-800" 
                value={selectedSubjectId} 
                onChange={e => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId} // Disable kalau belum pilih kelas
            >
                <option value="" className='text-gray-800'>-- Pilih Mapel --</option>
                {subjects.map((s: any) => (
                    <option key={s.id} value={s.id} className='text-gray-800'>{s.name}</option>
                ))}
            </select>
        </div>

        {/* DROPDOWN TIPE */}
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Tipe</label>
            <select className="w-full border p-2 rounded text-gray-800" value={gradeType} onChange={e => setGradeType(e.target.value)}>
                <option value="UH1">UH 1</option>
                <option value="UH2">UH 2</option>
                <option value="UTS">UTS</option>
                <option value="UAS">UAS</option>
                <option value="Tugas">Tugas</option>
            </select>
        </div>
        
        <button 
            onClick={handleLoadStudents}
            disabled={!selectedClassId || loadingStudents}
            className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900 disabled:bg-gray-300 flex justify-center items-center"
        >
            {loadingStudents ? 'Loading...' : 'Load Siswa'}
        </button>
      </div>

      {/* --- BAGIAN TABEL (Sama seperti sebelumnya) --- */}
      {loadingStudents && (
          <div className="py-12 text-center bg-white rounded-xl border border-dashed text-gray-500">
             Sedang mengambil data siswa...
          </div>
      )}

      {!loadingStudents && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
             <div className="p-4 bg-blue-50 flex justify-between items-center">
                 <span className="text-blue-800 text-sm font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2"/> Pastikan Mapel Benar
                 </span>
                 <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                    <Save className="w-4 h-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Semua'}
                 </button>
             </div>
             <table className="w-full text-left">
                 <thead className="bg-gray-100 border-b">
                     <tr>
                         <th className="px-6 py-3 w-16 text-gray-800">No</th>
                         <th className="px-6 py-3 text-gray-800">NIS</th>
                         <th className="px-6 py-3 text-gray-800">Nama</th>
                         <th className="px-6 py-3 text-gray-800">Nilai</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y">
                     {students.map((s: any, idx) => (
                         <tr key={s.id}>
                             <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                             <td className="px-6 py-3 font-mono text-gray-500">{s.nis}</td>
                             <td className="px-6 py-3 text-gray-500">{s.name}</td>
                             <td className="px-6 py-3 text-gray-500">
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    className="text-gray-500" 
                                    // Value harus diambil dari state, gunakan string kosong jika undefined agar tidak warning React
                                    value={inputGrades[s.id] !== undefined ? inputGrades[s.id] : ''} 
                                    onChange={(e) => handleScoreChange(s.id, e.target.value)} 
                                />
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
      )}

      {!loadingStudents && students.length === 0 && hasSearched && (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-gray-500">
             <div className="bg-gray-100 p-4 rounded-full mb-3">
                <UserX className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Siswa</h3>
             <p className="text-sm max-w-xs mx-auto mt-1">Belum ada data siswa di kelas ini.</p>
          </div>
      )}

      {!loadingStudents && !hasSearched && (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed text-gray-400 flex flex-col items-center">
            <Inbox className="w-12 h-12 mb-3 opacity-30" />
            <p>Pilih Kelas, Pilih Mapel, lalu klik "Load Siswa".</p>
          </div>
      )}

    </div>
  );
}