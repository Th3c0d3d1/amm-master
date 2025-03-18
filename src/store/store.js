import { configureStore } from '@reduxjs/toolkit'

// Importing the reducers
import provider from './reducers/provider'
import tokens from './reducers/tokens'
import amm from './reducers/amm'

// Takes and combines an object with reducers and returns a store object
export const store = configureStore({
  reducer: {
    provider,
    tokens,
    amm
  },
  // Disables the serializable check
  // Redux recommends to disable it for production
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
