import { useState, useEffect } from "react";
import type { State, User } from 'types';
import { fetcher } from "utils/fetcher";


export function useMe() {
  const initial_user_state: State<User | null> = {
    is_loading: true,
    error: null,
    data: null
  }
  const [user, setUser] = useState<State<User | null>>(initial_user_state);

  useEffect(() => {
   fetcher(`/api/users/me`).then(
    (data: User) => {
      let ready_state: State<User> = {
        is_loading: false,
        error: null,
        data: data
      };
      setUser(ready_state);
    }
   ).catch((error: string) => {
      setUser({
        is_loading: false,
        error: error,
        data: null
      });
   })
  }, []);


  return user;
}
