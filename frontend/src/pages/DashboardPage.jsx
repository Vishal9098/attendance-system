import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Users, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useSelector(s => s.auth)
  const [stats, setStats] = useState(null)
  const [todayAtt, setTodayAtt] = useState(null)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    api.get('/attendance/today').then(r => setTodayAtt(r.data)).catch(() => {})

    if (['admin', 'manager'].includes(user?.role)) {
      api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
      // Mock weekly chart data (replace with real API)
      setChartData([
        { day: 'Mon', present: 18, absent: 3 },
        { day: 'Tue', present: 20, absent: 1 },
        { day: 'Wed', present: 17, absent: 4 },
        { day: 'Thu', present: 21, absent: 0 },
        { day: 'Fri', present: 19, absent: 2 },
      ])
    }
  }, [])

  const now = new Date()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400">{now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Today's status for employee */}
      {todayAtt && (
        <div className="card border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 mb-1">Today's Status</p>
          <div className="flex items-center gap-3">
            <span className={`badge-${todayAtt.status || 'absent'}`}>
              {todayAtt.status === 'not_punched' ? 'Not Punched In' : todayAtt.status?.toUpperCase()}
            </span>
            {todayAtt.punch_in && (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                In: {new Date(todayAtt.punch_in).toLocaleTimeString()}
                {todayAtt.punch_out && ` | Out: ${new Date(todayAtt.punch_out).toLocaleTimeString()}`}
                {todayAtt.hours_worked && ` | ${todayAtt.hours_worked}h worked`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Admin/Manager stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Employees" value={stats.total_employees} color="bg-blue-500" />
          <StatCard icon={CheckCircle} label="Present Today" value={stats.present_today} color="bg-green-500" />
          <StatCard icon={AlertCircle} label="Incomplete" value={stats.incomplete_today} color="bg-yellow-500" />
          <StatCard icon={Clock} label="Pending OT" value={stats.pending_ot_requests} color="bg-purple-500" />
        </div>
      )}

      {/* Weekly chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            This Week's Attendance
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="present" fill="#22c55e" radius={[4,4,0,0]} name="Present" />
              <Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
