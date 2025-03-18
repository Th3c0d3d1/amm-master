// Used to create special reducers for provider
import { createSlice } from '@reduxjs/toolkit'

// Object that contains the provider slice of the state
// Creates the actions setProvider, setNetwork, and setAccount
// These actions are used to update the provider slice of the state
export const provider = createSlice({

  // Key name of the slice
  name: 'provider',
  initialState: {
    connection: null,
    chainId: null,
    account: null
  },
  reducers: {

    // Action creator that sets the provider in the provider slice of the state
    // ex. use instead of: const [provider, setProvider] = useState(null)
    setProvider: (state, action) => {
      state.connection = action.payload
    },
    setNetwork: (state, action) => {
      state.chainId = action.payload
    },

    // Triggers an action by calling setAccount function in App.js
    // Action creator that sets the account in the provider slice of the state
    // ex. use instead of: const [account, setAccount] = useState(null)
    setAccount: (state, action) => {

      // Make the state of the account equal to the payload
      // The payload is the account address argument passed to the action in App.js
      state.account = action.payload
    }
  }
})

// Exporting the actions
export const {  setProvider, setNetwork, setAccount } = provider.actions;

export default provider.reducer;
