import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Users, Search, UserX, UserCheck, Flag } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { user } = useSelector(s => s.auth)
  const [users, setUsers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const fetchUsers = () => api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {})
  const fetchAttendance = (date) => api.get('/admin/attendance', { params: date ? { date } : {} })
    .then(r => setAttendance(r.data)).catch(() => {})

  useEffect(() => { fetchUsers(); fetchAttendance() }, [])
  useEffect(() => { if (tab === 'attendance') fetchAttendance(dateFilter) }, [dateFilter, tab])

  const toggleUser = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-active`)
      toast.success('User status updated')
      fetchUsers()
    } catch { toast.error('Failed') }
  }

  const markFake = async (id) => {
    if (!confirm('Mark this record as fake/invalid?')) return
    try {
      await api.put(`/admin/attendance/${id}/mark-fake`)
      toast.success('Marked as fake')
      fetchAttendance(dateFilter)
    } catch { toast.error('Failed') }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users size={28} /> {user?.role === 'admin' ? 'Admin Panel' : 'Team Management'}
      </h1>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {['users', 'attendance'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t === 'users' ? 'Employees' : 'All Attendance'}</button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Search employees..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-sm text-gray-500">{filteredUsers.length} employees</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Name','Email','Role','Status','Action'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-3 font-medium">{u.name}</td>
                    <td className="py-3 px-3 text-gray-500">{u.email}</td>
                    <td className="py-3 px-3 capitalize">{u.role}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {user?.role === 'admin' && (
                        <button onClick={() => toggleUser(u.id)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                            u.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {u.is_active ? <><UserX size={14}/> Disable</> : <><UserCheck size={14}/> Enable</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <input type="date" className="input max-w-[180px]" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)} />
            <button onClick={() => setDateFilter('')} className="btn-secondary text-sm">Clear</button>
            <span className="text-sm text-gray-500">{attendance.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Date','Employee','Punch In','Punch Out','Hours','Status','Action'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {attendance.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${r.is_fake ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-3">{r.date}</td>
                    <td className="py-3 px-3 font-medium">{r.user_name}</td>
                    <td className="py-3 px-3">{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-3">{r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-3">{r.hours_worked ? `${r.hours_worked}h` : '—'}</td>
                    <td className="py-3 px-3"><span className={`badge-${r.status || 'absent'}`}>{r.status || 'absent'}</span></td>
                    <td className="py-3 px-3">
                      {!r.is_fake && user?.role === 'admin' && (
                        <button onClick={() => markFake(r.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors">
                          <Flag size={12} /> Flag
                        </button>
                      )}
                      {r.is_fake && <span className="text-xs text-red-500">Flagged</span>}
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}