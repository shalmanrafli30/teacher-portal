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
      // [UPDATE] Menggunakan Endpoint GraphQL
      const response = await axios.post('https://api.meccaschool.online/graphql', {
        query: `
          mutation Login($username: String!, $password: String!, $role: String!) {
            login(username: $username, password: $password, role: $role) {
              token
              user {
                id
                username
                name
                role
              }
            }
          }
        `,
        variables: {
          username: nip,
          password: password,
          role: 'teacher' // Hardcode role teacher
        }
      });

      // [UPDATE] Cek Error dari GraphQL
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const loginData = response.data.data?.login;
      const token = loginData?.token;
      const user = loginData?.user;

      if (!token) {
        throw new Error('Gagal login. Token tidak ditemukan.');
      }

      // Validasi Role di Client (Double check)
      if (user?.role !== 'teacher') {
        throw new Error('Akun ini terdaftar, tapi bukan sebagai Guru.');
      }

      // Simpan ke LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect ke Dashboard
      router.push('/dashboard'); 

    } catch (err: unknown) {
      console.error(err);
      
      let msg = 'NIP atau Password salah.';
      
      if (axios.isAxiosError(err)) {
         // Error jaringan atau axios
         msg = err.response?.data?.message || err.message || msg;
      } else if (err instanceof Error) {
         // Error dari throw new Error di atas (GraphQL errors)
         msg = err.message;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900 px-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full shadow-inner">
            <GraduationCap className="text-blue-700 w-10 h-10" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Teacher Portal</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Masuk untuk mengelola kelas</p>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-200 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">NIP</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Masuk Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Mecca School System
            </p>
        </div>
      </div>
    </div>
  );
}