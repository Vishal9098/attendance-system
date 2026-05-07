import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import attendanceReducer from './slices/attendanceSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
})
