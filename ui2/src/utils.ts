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

interface Args<T> {
  container: T[]
  items: T[]
}

function contains_every<T = string>({container, items}: Args<T>): boolean {
  // Returns true if every item is included in the container
  // Returns false if some items are not included in the container
  return items.every(i => container.includes(i))
}

type ReorderArgs<T, K> = {
  arr: T[]
  source_ids: Array<K>
  target_id: K
  position: "before" | "after"
  idf?: (val: T) => any
}

/**
* Returns an array with reordered items.
*
* Items are reordered as follows: source_ids will be positioned
*  before or after target_id (depending on positioned arg).
*  Couple of examples.
*  Example 1:
*
*    arr = [ 1, 2, 3, 4 ]
*    source_ids = [2]
*    target_id = 4
*    position = 'after'
*
*  In other words, item 2 will be positioned after item 4.
*  Result will be:
*
*    result = [1, 3, 4, 2]
*
*  Example 2:
*
*    arr = [ 1, 2, 3, 4 ]
*    source_ids = [2]
*    target_id = 4
*    position = 'before'

  Result will be (element 2 will be positioned before element 4):

    result = [1, 3, 2, 4]

  Example 3:

    arr = [1, 2]
    source_ids = [2]
    target_id = 1
    position = 'before'

    Result will be:

    result = [2, 1]

  Example 4:

    arr = [1, 2]
    source_ids = [2]
    target_id = 1
    position = 'after'

    Result will be:

    result = [1, 2]

  i.e. same as input because source was already after target

  Example 5:

    arr = [1, 2, 3, 4, 5, 6]
    source_ids = [1, 3]
    target = 5

    result: [2, 4, 5, 1, 3, 6]
*/
function reorder<T = number, K = string>({
  arr,
  source_ids,
  target_id,
  position,
  idf
}: ReorderArgs<T, K>): T[] {
  if (!idf) {
    idf = (x: T): T => x
  }

  const arr_ids = arr.map(i => idf!(i))

  if (!arr_ids.includes(target_id)) {
    console.warn(`Target ID ${target_id} was not found in arr: `, arr)
    return arr
  }

  let result: T[] = []
  let insert_now = false
  const source: T[] = arr.filter(i => source_ids.includes(idf!(i)))

  if (source.length == 0) {
    throw new Error("Source list is empty. Cannot reorder.")
  }

  arr.forEach((item: T) => {
    if (insert_now) {
      result.push(...source)
      insert_now = false
    }

    if (!source_ids.includes(idf!(item)) && idf!(item) !== target_id) {
      result.push(item)
    } else if (idf!(item) === target_id) {
      if (position == "before") {
        result.push(...source)
        if (!source_ids.includes(idf!(item))) {
          result.push(item)
        }
      } else {
        insert_now = true // will insert source on next iteration
        if (!source_ids.includes(idf!(item))) {
          result.push(item)
        }
      }
    }
  })

  // is the case when target is last element of the array
  // and we want to insert "after"
  if (result.length < arr.length) {
    result.push(...source)
  }

  return result
}

export {getCurrentUser, contains_every, reorder}
