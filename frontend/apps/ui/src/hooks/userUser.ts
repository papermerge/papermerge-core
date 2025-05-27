import type {User} from "../types"

export default function useUser(): User {
  const username = import.meta.env.VITE_USERNAME

  return username
}
