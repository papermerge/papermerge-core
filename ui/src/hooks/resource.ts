import { useState, useEffect } from "react";
import type { Vow } from 'types';
import { fetcher } from "utils/fetcher";


export function useResource<T>(url: string): Vow<T> {
  const initial_user_state: Vow<T> = {
    is_pending: true,
    error: null,
    data: null
  }
  const [resource, setResource] = useState<Vow<T>>(initial_user_state);

  useEffect(() => {
   fetcher(url).then(
    (data: T) => {
      let ready_state: Vow<T> = {
        is_pending: false,
        error: null,
        data: data
      };
      setResource(ready_state);
    }
   ).catch((error: string) => {
      setResource({
        is_pending: false,
        error: error.toString(),
        data: null
      });
   })
  }, [url]);


  return resource;
}
