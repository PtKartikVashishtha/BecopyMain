import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import jobReducer from './jobSlice';
import contributorReducer from './contributorSlice';
import recruiterReducer from './recruiterSlice';
import contributionReducer from './contributionSlice';
import programReducer from './programSlice';
import categoryReducer from './categorySlice';
import dashStringSlice from './dashStringSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobReducer,
  programs: programReducer,
  contributors: contributorReducer,
  recruiters: recruiterReducer,
  contributions: contributionReducer,
  categories: categoryReducer,
  dashboardstring: dashStringSlice,
});

export default rootReducer;