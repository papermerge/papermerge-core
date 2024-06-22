import { configureStore } from "@reduxjs/toolkit";
import currentUserReducer from "../slices/currentUser.ts";

export const store = configureStore({
  reducer: {
    currentUser: currentUserReducer,
  },
});
