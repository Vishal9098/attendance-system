import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const punchIn = createAsyncThunk('attendance/punchIn', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/attendance/punch-in', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Punch-in failed')
  }
})

export const punchOut = createAsyncThunk('attendance/punchOut', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/attendance/punch-out', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Punch-out failed')
  }
})

export const fetchTodayStatus = createAsyncThunk('attendance/today', async () => {
  const { data } = await api.get('/attendance/today')
  return data
})

export const fetchHistory = createAsyncThunk('attendance/history', async (params) => {
  const { data } = await api.get('/attendance/history', { params })
  return data
})

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    today: null,
    history: [],
    loading: false,
    error: null,
    lastAction: null
  },
  reducers: {
    clearAttendanceError: (state) => { state.error = null }
  },
  extraReducers: (builder) => {
    const setLoading = (state) => { state.loading = true; state.error = null }
    const setError = (state, action) => { state.loading = false; state.error = action.payload }

    builder
      .addCase(punchIn.pending, setLoading)
      .addCase(punchIn.fulfilled, (state, action) => { state.loading = false; state.lastAction = action.payload })
      .addCase(punchIn.rejected, setError)
      .addCase(punchOut.pending, setLoading)
      .addCase(punchOut.fulfilled, (state, action) => { state.loading = false; state.lastAction = action.payload })
      .addCase(punchOut.rejected, setError)
      .addCase(fetchTodayStatus.fulfilled, (state, action) => { state.today = action.payload })
      .addCase(fetchHistory.fulfilled, (state, action) => { state.history = action.payload })
  }
})

export const { clearAttendanceError } = attendanceSlice.actions
export default attendanceSlice.reducer
