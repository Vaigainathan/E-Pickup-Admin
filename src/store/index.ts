import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import driverSlice from './slices/driverSlice'
import bookingSlice from './slices/bookingSlice'
import emergencySlice from './slices/emergencySlice'
import supportSlice from './slices/supportSlice'
import systemSlice from './slices/systemSlice'
import analyticsSlice from './slices/analyticsSlice'
import settingsSlice from './slices/settingsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    drivers: driverSlice,
    bookings: bookingSlice,
    emergency: emergencySlice,
    support: supportSlice,
    system: systemSlice,
    analytics: analyticsSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
