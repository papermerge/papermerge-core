import Cookies from "js-cookie"
import {createSlice} from "@reduxjs/toolkit"
import {getDefaultHeaders} from "@/utils"

const COOKIE_NAME = "access_token"

interface AuthState {
  token: string | null
  remote_user: string | null
  remote_groups: string | null
  remote_email: string | null
  remote_name: string | null
}

const initialState: AuthState = {
  token: null,
  remote_user: null,
  remote_groups: null,
  remote_email: null,
  remote_name: null
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  // Remove the reducer definitions
  reducers: {
    cookieLoaded: state => {
      const headers = getDefaultHeaders()
      const token = Cookies.get(COOKIE_NAME)

      if (headers["Remote-User"]) {
        state.remote_user = headers["Remote-User"]
      }

      if (headers["Remote-Groups"]) {
        state.remote_groups = headers["Remote-Groups"]
      }

      if (headers["Remote-Email"]) {
        state.remote_email = headers["Remote-Email"]
      }

      if (headers["Remote-Name"]) {
        state.remote_name = headers["Remote-Name"]
      }

      if (token) {
        state.token = token
      }
    }
  }
})

export const {cookieLoaded} = authSlice.actions
export default authSlice.reducer
