// store/index.ts - Complete store configuration
import { configureStore } from '@reduxjs/toolkit';
import jobSlice from './reducers/jobSlice';
import recruiterSlice from './reducers/recruiterSlice';
import geoSlice from './reducers/geoSlice';
import programSlice from './reducers/programSlice';
import settingsSlice from './reducers/settingSlice';
import categorySLice from './reducers/categorySlice';
import contributorsReducer from '@/store/reducers/contributorSlice';

import { set } from 'date-fns';

export const store = configureStore({
  reducer: {
    jobs: jobSlice,
    recruiters: recruiterSlice,
    geo: geoSlice,
    programs: programSlice,
    settings : settingsSlice,
    categories: categorySLice,
    contributors: contributorsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;