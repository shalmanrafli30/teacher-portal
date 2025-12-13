'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { GraduationCap, Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://api.meccaschool.online/api/auth/login', {
        username: nip,
        password: password,
        role: 'teacher'
      });

      // --- PERBAIKAN DI SINI ---
      // 1. Ambil token dan object user
      const { token, user } = response.data;
      
      // 2. Ambil role dari dalam object user
      // Gunakan optional chaining (?.) jaga-jaga kalau user null
      const role = user?.role; 

      // 3. Cek Role
      if (role !== 'teacher') {
        setError('Akun ini terdaftar, tapi bukan sebagai Guru.');
        setLoading(false);
        return;
      }

      // 4. Simpan ke LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role); // Simpan role juga

      // 5. Redirect
      router.push('/dashboard'); 

    } catch (err: any) {
      console.error(err);
      // Tampilkan pesan error spesifik dari backend jika ada
      const msg = err.response?.data?.message || 'NIP atau Password salah.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <GraduationCap className="text-blue-700 w-10 h-10" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Teacher Portal</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Masuk untuk mengelola kelas</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">NIP</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-400"
              placeholder="Nomor Induk Pegawai"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center shadow-lg hover:shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}