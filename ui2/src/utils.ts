import {SliceState} from "@/types"
import {store} from "@/app/store"

import type {User} from "@/types"

export function getBaseURL(): string {
  const base_url = import.meta.env.VITE_BASE_URL
  if (base_url) {
    return base_url
  }

  return ""
}

export function getRemoteUser(): string | null {
  const remote_user = import.meta.env.VITE_REMOTE_USER

  if (remote_user) {
    return remote_user
  }

  return null
}

export function getDefaultHeaders(): Record<string, string> {
  const remote_user = getRemoteUser()
  let headers = {}

  if (remote_user) {
    headers = {
      "Remote-User": remote_user,
      "Remote-Groups": "",
      "Remote-Email": "",
      "Remote-Name": "",
      "Content-Type": "application/json"
    }
  }

  return headers
}

async function getCurrentUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    const max_try = 5
    let count = 0

    function get_user() {
      const user: SliceState<User> = store.getState().currentUser
      if (user.status == "succeeded") {
        resolve(user.data!)
      } else if (user.status == "failed") {
        reject("Failed to load user")
      } else if (count < max_try) {
        count += 1
        setTimeout(get_user, 1000)
      }
    }
    // initial call
    get_user()
  })
}

export {getCurrentUser}
