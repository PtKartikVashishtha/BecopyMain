import { combineReducers } from '@reduxjs/toolkit';
// Import your reducers here
import contributorReducer from './contributorSlice';
import recruiterReducer from './recruiterSlice';
import categoryReducer from './categorySlice';
import programReducer from './programSlice';
import contributionReducer from './contributionSlice';
import jobReducer from './jobSlice';
import dashStringSlice from './dashStringSlice';

import inviteSlice from './inviteSlice';
import chatSlice from './chatSlice';
import settingSlice from './settingSlice';
import geoReducer from './geoSlice'; // Add geo reducer
import { store } from '../store';

const rootReducer = combineReducers({
  // Add your reducers here
  contributors: contributorReducer,
  recruiters: recruiterReducer,
  categories: categoryReducer,
  programs: programReducer,
  contributions: contributionReducer,
  jobs: jobReducer,
  dashboardstring: dashStringSlice,
  settings: settingSlice,
  invites: inviteSlice,
  chat: chatSlice ,
  geo: geoReducer, // Add geo slice to store
});

export default rootReducer;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;