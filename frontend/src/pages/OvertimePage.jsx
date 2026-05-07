import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Timer, Plus, Check, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function OvertimePage() {
  const { user } = useSelector(s => s.auth)
  const [myRequests, setMyRequests] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', reason: '', expected_hours: '' })
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    api.get('/overtime/my-requests').then(r => setMyRequests(r.data)).catch(() => {})
    if (['admin','manager'].includes(user?.role)) {
      api.get('/overtime/pending').then(r => setPendingRequests(r.data)).catch(() => {})
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/overtime/request', { ...form, expected_hours: Number(form.expected_hours) })
      toast.success('OT request submitted!')
      setShowForm(false)
      setForm({ date: '', reason: '', expected_hours: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit OT request')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, status) => {
    try {
      await api.put(`/overtime/${id}/action`, { status, remarks: '' })
      toast.success(`OT request ${status}`)
      fetchData()
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const statusBadge = (s) => {
    const map = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || ''}`}>{s}</span>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overtime</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Request OT
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">New OT Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="input" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Extra Hours</label>
              <input type="number" min="0.5" max="8" step="0.5" className="input" required
                value={form.expected_hours} onChange={e => setForm({...form, expected_hours: e.target.value})} placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea className="input min-h-[80px] resize-none" required value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})} placeholder="Reason for overtime..." />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending requests for manager/admin */}
      {pendingRequests.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Pending Approvals ({pendingRequests.length})</h2>
          <div className="space-y-3">
            {pendingRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">{r.employee_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{r.date} • {r.expected_hours}h • {r.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, 'approved')}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => handleAction(r.id, 'rejected')}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My requests */}
      <div className="card">
        <h2 className="font-semibold mb-4">My OT Requests</h2>
        <div className="space-y-3">
          {myRequests.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium">{r.date}</p>
                <p className="text-sm text-gray-500">{r.expected_hours}h • {r.reason}</p>
              </div>
              {statusBadge(r.status)}
            </div>
          ))}
          {myRequests.length === 0 && <p className="text-gray-400 text-center py-4">No OT requests yet</p>}
        </div>
      </div>
    </div>
  )
}
