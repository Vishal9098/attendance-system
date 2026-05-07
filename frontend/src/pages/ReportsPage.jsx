import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FileText, Download } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { user } = useSelector(s => s.auth)
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState({ start_date: '', end_date: '' })
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const endpoint = ['admin','manager'].includes(user?.role) ? '/reports/team-report' : '/reports/my-report'
      const { data } = await api.get(endpoint, { params: filters })
      setRecords(data.records || data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() }, [])

  const exportFile = async (type) => {
    try {
      const resp = await api.get(`/reports/export/${type}`, { params: filters, responseType: 'blob' })
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_report.${type === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error(`Export failed`) }
  }

  const summary = {
    present: records.filter(r => r.status === 'present').length,
    incomplete: records.filter(r => r.status === 'incomplete').length,
    absent: records.filter(r => !r.status || r.status === 'absent').length,
    totalHours: records.reduce((sum, r) => sum + (r.hours_worked || 0), 0).toFixed(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText size={28} /> Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => exportFile('excel')} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => exportFile('pdf')} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" className="input" value={filters.start_date}
            onChange={e => setFilters({...filters, start_date: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input type="date" className="input" value={filters.end_date}
            onChange={e => setFilters({...filters, end_date: e.target.value})} />
        </div>
        <button onClick={fetchReport} className="btn-primary">Apply Filters</button>
        <button onClick={() => { setFilters({start_date:'',end_date:''}); fetchReport() }} className="btn-secondary">Reset</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: summary.present, color: 'text-green-600' },
          { label: 'Incomplete', value: summary.incomplete, color: 'text-yellow-600' },
          { label: 'Absent', value: summary.absent, color: 'text-red-600' },
          { label: 'Total Hours', value: `${summary.totalHours}h`, color: 'text-blue-600' }
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Date','Employee','Punch In','Punch Out','Hours Worked','Status'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-3 font-medium">{r.date}</td>
                    <td className="py-3 px-3">{r.user_name || user?.name}</td>
                    <td className="py-3 px-3">{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-3">{r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-3">{r.hours_worked ? `${r.hours_worked}h` : '—'}</td>
                    <td className="py-3 px-3"><span className={`badge-${r.status || 'absent'}`}>{r.status || 'absent'}</span></td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
