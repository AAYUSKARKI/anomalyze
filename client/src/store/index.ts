import { configureStore as ConfigureStore, combineReducers } from "@reduxjs/toolkit"
import authReducer from "./AuthSlice"
import fileReducer from "./FileSlice"
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const userPersistConfig = {
  key: 'user',
  version: 1,
  storage,
}

const filePersistConfig = {
  key: 'files',
  version: 1,
  storage,
}

const persistedUserReducer = persistReducer(userPersistConfig, authReducer);
const persistedFileReducer = persistReducer(filePersistConfig, fileReducer);

const rootReducer = combineReducers({
  user: persistedUserReducer,
  files: persistedFileReducer
});

const store = ConfigureStore({
  reducer:rootReducer,
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      
    },
  }),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store