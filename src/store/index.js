import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import marketsReducer from "./slices/marketSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    markets: marketsReducer,
  },
});

