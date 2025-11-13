import {RootState} from "@/app/types"
import {createSlice} from "@reduxjs/toolkit"

export interface NotificationsState {
  activeCount: number
}

const initialState: NotificationsState = {
  activeCount: 0
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationShown: state => {
      state.activeCount += 1
    },
    notificationHidden: state => {
      state.activeCount = Math.max(0, state.activeCount - 1)
    },
    notificationsCleared: state => {
      state.activeCount = 0
    }
  }
})

export const {notificationShown, notificationHidden, notificationsCleared} =
  notificationsSlice.actions

export const selectNotificationCount = (state: RootState) =>
  state.notifications.activeCount

export default notificationsSlice.reducer
