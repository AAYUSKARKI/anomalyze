import { createSlice } from '@reduxjs/toolkit';
import type{  PayloadAction } from '@reduxjs/toolkit';
import type{ CsvFile } from '../types/CsvFile';

interface FileState {
  files: CsvFile[];
  selectedFile: CsvFile | null;
  selectedFeatures: string[];
}

const initialState: FileState = {
  files: [],
  selectedFile: null,
  selectedFeatures: [],
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<CsvFile>) => {
      state.files.push(action.payload);
    },
    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter(file => file.id !== action.payload);
      if (state.selectedFile?.id === action.payload) {
        state.selectedFile = null;
      }
    },
    updateFile(state, { payload }: PayloadAction<CsvFile>) {
      state.files = state.files.map(file => file.id === payload.id ? payload : file);
      if (state.selectedFile?.id === payload.id) {
        state.selectedFile = payload;
      }
    },
    setSelectedFile: (state, action: PayloadAction<CsvFile | null>) => {
      state.selectedFile = action.payload;
    },
    setSelectedFeatures: (state, action: PayloadAction<string[]>) => {
      state.selectedFeatures = action.payload;
    },
  },
});

export const { addFile, removeFile, setSelectedFile, updateFile, setSelectedFeatures } = fileSlice.actions;
export default fileSlice.reducer;