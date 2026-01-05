'use client';

import {useState, useEffect} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {LayoutDashboard, Calendar, ClipboardList, UserCheck, LogOut, Menu, X} from "lucide-react";

export default function DashboardLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // [FIX] Ubah default jadi false agar mobile start tertutup
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menuItems = [
    {name: "Dashboard", href: "/dashboard", icon: LayoutDashboard},
    {name: "Jadwal Mengajar", href: "/schedule", icon: Calendar}, // Sesuaikan href
    {name: "Input Nilai", href: "/grades", icon: ClipboardList},   // Sesuaikan href
    {name: "Input Absensi", href: "/attendance", icon: UserCheck}  // Sesuaikan href
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Backdrop (Overlay Gelap) untuk Mobile */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Mecca Admin</h2>
            <p className="text-xs text-slate-400">Teacher Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Highlight jika path diawali href menu (biar submenu juga aktif)
            // Kecuali dashboard home yg cuma '/' atau '/dashboard'
            const isActive = item.href === '/dashboard' 
                ? pathname === item.href 
                : pathname.startsWith(item.href);

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} // Tutup sidebar saat menu diklik (Mobile)
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 p-1 hover:bg-gray-100 rounded">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-800">Teacher Portal</span>
          <div className="w-6"></div> {/* Spacer biar text tengah */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            {children}
        </main>
      </div>
    </div>
  );
}