import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('darkMode') === 'true',
    sidebarOpen: true
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      localStorage.setItem('darkMode', state.darkMode)
      document.documentElement.classList.toggle('dark', state.darkMode)
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen }
  }
})

export const { toggleDarkMode, toggleSidebar } = uiSlice.actions
export default uiSlice.reducer
