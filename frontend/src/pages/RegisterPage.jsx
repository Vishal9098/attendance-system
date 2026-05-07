import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, clearError } from '../store/slices/authSlice'
import FaceCapture from '../components/FaceCapture'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [faceImage, setFaceImage] = useState(null)

  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()) } }, [error])

  const handleStep1 = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('All fields required')
    setStep(2)
  }

  const handleRegister = async () => {
    if (!faceImage) return toast.error('Please capture your face photo')
    const result = await dispatch(registerUser({ ...form, face_image: faceImage }))
    if (registerUser.fulfilled.match(result)) {
      toast.success('Registration successful! Please login.')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold">AttendAI</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="card">
          {/* Step indicators */}
          <div className="flex gap-2 mb-6">
            {[1,2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`} />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-lg font-semibold">Personal Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input className="input" required value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="input" required value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input type="password" className="input" required value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">Next: Face Registration →</button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Face Registration</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your face will be used for attendance verification. Ensure good lighting.
              </p>
              <FaceCapture onCapture={setFaceImage} label="Capture Face" />
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button onClick={handleRegister} disabled={loading || !faceImage} className="btn-primary flex-1">
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
