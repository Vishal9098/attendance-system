import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { punchIn, punchOut, fetchTodayStatus, fetchHistory } from '../store/slices/attendanceSlice'
import FaceCapture from '../components/FaceCapture'
import { Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const dispatch = useDispatch()
  const { today, history, loading } = useSelector(s => s.attendance)
  const [faceImage, setFaceImage] = useState(null)
  const [location, setLocation] = useState(null)
  const [locError, setLocError] = useState(null)
  const [tab, setTab] = useState('punch')

  useEffect(() => {
    dispatch(fetchTodayStatus())
    dispatch(fetchHistory({}))
    getLocation()
  }, [])

  const getLocation = () => {
    if (!navigator.geolocation) return setLocError("Geolocation not supported")
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocError("Location access denied. Please allow location.")
    )
  }

  const handlePunch = async (type) => {
    if (!faceImage) return toast.error('Please capture your face first')
    if (!location) return toast.error('Location required. Please allow location access.')

    const payload = { face_image: faceImage, ...location }
    const action = type === 'in' ? punchIn : punchOut
    const result = await dispatch(action(payload))

    if (action.fulfilled.match(result)) {
      toast.success(`Punch ${type === 'in' ? 'In' : 'Out'} successful! Confidence: ${result.payload.confidence}%`)
      dispatch(fetchTodayStatus())
      dispatch(fetchHistory({}))
      setFaceImage(null)
    } else {
      toast.error(result.payload || `Punch ${type} failed`)
    }
  }

  const canPunchIn = !today?.punch_in
  const canPunchOut = today?.punch_in && !today?.punch_out

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {['punch', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >{t === 'punch' ? 'Punch In/Out' : 'History'}</button>
        ))}
      </div>

      {tab === 'punch' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Status card */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">Today's Status</h2>
            {today?.punch_in ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span>Punched In at {new Date(today.punch_in).toLocaleTimeString()}</span>
                </div>
                {today.punch_out ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock size={20} />
                      <span>Punched Out at {new Date(today.punch_out).toLocaleTimeString()}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm">Hours Worked: <strong>{today.hours_worked}h</strong></p>
                      <p className="text-sm">Status: <span className={`badge-${today.status}`}>{today.status?.toUpperCase()}</span></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not punched out yet</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle size={20} />
                <span>Not punched in today</span>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className={location ? 'text-green-500' : 'text-red-500'} />
              {location
                ? <span className="text-gray-600 dark:text-gray-300">Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                : <span className="text-red-500">{locError || 'Getting location...'}</span>
              }
              {locError && (
                <button onClick={getLocation} className="text-blue-600 hover:underline text-xs">Retry</button>
              )}
            </div>
          </div>

          {/* Face capture + action */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-lg">Face Verification</h2>
            <FaceCapture onCapture={setFaceImage} label="Capture Live Photo" />

            {(canPunchIn || canPunchOut) && (
              <div className="flex gap-3">
                {canPunchIn && (
                  <button onClick={() => handlePunch('in')} disabled={loading || !faceImage}
                    className="btn-primary flex-1">
                    {loading ? 'Processing...' : '✅ Punch In'}
                  </button>
                )}
                {canPunchOut && (
                  <button onClick={() => handlePunch('out')} disabled={loading || !faceImage}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Processing...' : '🚪 Punch Out'}
                  </button>
                )}
              </div>
            )}

            {today?.punch_in && today?.punch_out && (
              <p className="text-center text-sm text-gray-500">Attendance completed for today ✅</p>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Attendance History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Date','Punch In','Punch Out','Hours','Status'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-3 font-medium">{r.date}</td>
                    <td className="py-3 px-3">{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-3">{r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-3">{r.hours_worked ? `${r.hours_worked}h` : '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`badge-${r.status || 'absent'}`}>{r.status || 'absent'}</span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}