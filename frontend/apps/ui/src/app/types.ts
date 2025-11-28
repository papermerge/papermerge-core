import {rootReducer, store} from "@/app/store"

export type AppStore = typeof store
export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState
) => ReturnType

export type RootState = {
  [K in keyof typeof rootReducer]: ReturnType<(typeof rootReducer)[K]>
}
export type AppDispatch = typeof store.dispatch
