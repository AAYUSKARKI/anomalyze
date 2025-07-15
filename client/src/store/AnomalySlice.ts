import { createSlice } from '@reduxjs/toolkit';
import type{  PayloadAction } from '@reduxjs/toolkit';
import type { AnomalyData } from '../types/Anomaly';
interface AnomalyState {
  anomalyData: AnomalyData[];
}

const initialState: AnomalyState = {
  anomalyData: [],
};

const anomalySlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setAnomalyData: (state, action: PayloadAction<AnomalyData[]>) => {
      state.anomalyData = action.payload;
    },
  },
});

export const { setAnomalyData } = anomalySlice.actions;
export default anomalySlice.reducer;