import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { toggleDarkMode } from '../store/slices/uiSlice'
import {
  LayoutDashboard, Clock, Timer, Users, FileText,
  Bot, Moon, Sun, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','manager','employee'] },
  { path: '/attendance', icon: Clock, label: 'Attendance', roles: ['admin','manager','employee'] },
  { path: '/overtime', icon: Timer, label: 'Overtime', roles: ['admin','manager','employee'] },
  { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin','manager','employee'] },
  { path: '/admin', icon: Users, label: 'Team / Admin', roles: ['admin','manager'] },
  { path: '/ai-assistant', icon: Bot, label: 'AI Assistant', roles: ['admin','manager'] },
]

export default function Layout() {
  const { user } = useSelector(s => s.auth)
  const { darkMode } = useSelector(s => s.ui)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && <span className="font-bold text-blue-600 text-lg">AttendAI</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {filteredNav.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon size={20} />
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
          {sidebarOpen && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium text-gray-700 dark:text-gray-300">{user?.name}</div>
              <div className="capitalize">{user?.role}</div>
            </div>
          )}
          <button onClick={() => dispatch(toggleDarkMode())}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={20} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>
    </div>
  )
}
