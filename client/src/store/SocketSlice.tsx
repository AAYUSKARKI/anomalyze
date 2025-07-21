import { createSlice } from '@reduxjs/toolkit';

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    isSocketConnected: false,
  },
  reducers: {
    setSocketConnected: (state, action) => {
      state.isSocketConnected = action.payload;
    },
  },
});

export const { setSocketConnected } = socketSlice.actions;
export default socketSlice.reducer;
