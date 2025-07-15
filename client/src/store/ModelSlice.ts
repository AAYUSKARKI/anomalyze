import { createSlice } from '@reduxjs/toolkit';
import type{  PayloadAction } from '@reduxjs/toolkit';
import type { ModelOption } from '../types/ModelOption';
interface ModelState {
  selectedModel: ModelOption | null;
}

const initialState: ModelState = {
  selectedModel: null
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<ModelOption>) => {
      state.selectedModel = action.payload;
    },
  },
});

export const { setSelectedModel } = modelSlice.actions;
export default modelSlice.reducer;