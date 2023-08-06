import { useState, useEffect } from "react";
import type { State, SearchResult } from 'types';
import { fetcher } from "utils/fetcher";


export function useSearch(query: string) {
  const initial_user_state: State<SearchResult[]> = {
    is_loading: true,
    error: null,
    data: []
  }
  const [searchRsults, setSearchResults] = useState<State<SearchResult[]>>(initial_user_state);

  useEffect(() => {
   fetcher(`/api/search/?q=${query}`).then(
    (data: SearchResult[]) => {
      let ready_state: State<SearchResult[]> = {
        is_loading: false,
        error: null,
        data: data
      };
      setSearchResults(ready_state);
    }
   ).catch((error: string) => {
    setSearchResults({
        is_loading: false,
        error: error,
        data: []
      });
   })
  }, [query]);


  return searchRsults;
}
