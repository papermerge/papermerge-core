import Cookies from "js-cookie"
import {SliceState} from "@/types"
import {store} from "@/app/store"

import type {User} from "@/types"

export function getBaseURL(trimBackslash?: boolean): string {
  const base_url = import.meta.env.VITE_BASE_URL

  if (base_url) {
    if (trimBackslash) {
      return base_url.substring(0, base_url.length - 1)
    }

    return base_url
  }

  return ""
}

export function getRemoteUser(): string | null {
  const COOKIE_REMOTE_USER = "remote_user"
  const remote_user =
    import.meta.env.VITE_REMOTE_USER || Cookies.get(COOKIE_REMOTE_USER)

  if (remote_user) {
    return remote_user
  }

  return null
}

export function getRemoteGroups(): string | null {
  const COOKIE_REMOTE_GROUPS = "remote_groups"
  const remote_groups =
    import.meta.env.VITE_REMOTE_GROUPS || Cookies.get(COOKIE_REMOTE_GROUPS)

  if (remote_groups) {
    return remote_groups
  }

  return null
}

export function getRemoteEmail(): string | null {
  const COOKIE_REMOTE_EMAIL = "remote_email"
  const remote_email =
    import.meta.env.VITE_REMOTE_EMAIL || Cookies.get(COOKIE_REMOTE_EMAIL)

  if (remote_email) {
    return remote_email
  }

  return null
}

export function getRemoteName(): string | null {
  const COOKIE_REMOTE_NAME = "remote_name"
  const remote_name =
    import.meta.env.VITE_REMOTE_NAME || Cookies.get(COOKIE_REMOTE_NAME)

  if (remote_name) {
    return remote_name
  }

  return null
}

export function getDefaultHeaders(): Record<string, string> {
  const COOKIE_NAME = "access_token"
  const remote_user = getRemoteUser()
  const remote_groups = getRemoteGroups()
  const remote_email = getRemoteEmail()
  const remote_name = getRemoteName()
  const token = Cookies.get(COOKIE_NAME)

  let headers: Record<string, string> = {}

  if (remote_user) {
    headers = {
      "Remote-User": remote_user,
      "Remote-Groups": remote_groups || "",
      "Remote-Email": remote_email || "",
      "Remote-Name": remote_name || ""
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  headers["Content-Type"] = "application/json"

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

export function makeRandomString(length: number): string {
  let result = ""
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

export function equalUUIDs(id1: string, id2: string): boolean {
  const i1 = id1.replace(/\-/g, "")
  const i2 = id2.replace(/\-/g, "")

  return i1 == i2
}
