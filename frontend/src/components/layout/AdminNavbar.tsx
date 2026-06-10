import { Menu } from 'lucide-react'
import Logo from './Logo'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
  photo?: string | null
}

interface AdminNavbarProps {
  user: User
  title: string
}

export default function AdminNavbar({ user, title }: AdminNavbarProps) {
  return (
    <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-100 px-8 py-5 shadow-xs sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-black text-slate-800 tracking-wider font-quicksand uppercase">
          {title}
        </h1>
      </div>

      {/* User Profile Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {user.photo ? (
            <img
              src={user.photo.startsWith('http') ? user.photo : `http://localhost:8000/storage/${user.photo}`}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border border-slate-200 bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left font-quicksand">
            <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{user.name}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              {user.role === 'admin' ? 'HR Manager' : 'Staff'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

interface AdminMobileNavbarProps {
  onMenuClick: () => void
}

export function AdminMobileNavbar({ onMenuClick }: AdminMobileNavbarProps) {
  return (
    <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-orange-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 bg-slate-50 border border-slate-200 hover:bg-orange-50/50 rounded-xl text-slate-600 hover:text-red-500 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo className="w-8 h-8" />
      </div>
    </header>
  )
}
