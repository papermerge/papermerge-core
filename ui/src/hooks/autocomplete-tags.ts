import { useState, useEffect } from "react";
import type { ColoredTagType } from "types";


type State<T> = {
  is_loading: boolean;
  error: string | null;
  data: T[]
}


type ResultType = State<ColoredTagType>;


function pull_user_tags(endpoint_url: string, headers: HeadersInit) {
  return fetch(endpoint_url, {headers: headers}).then(res => {
    if (res.status == 200) {
      return res.json();
    }
  })
}


function useAutocompleteTags(endpoint_url: string, headers: HeadersInit): ResultType {

  const initial_state: ResultType = {
    is_loading: true,
    error: null,
    data: []
  };
  const [autocomplete_tags, setAutocompleteTags] = useState<ResultType>(initial_state);

  useEffect(() => {
    pull_user_tags(endpoint_url, headers).then(data => {
      setAutocompleteTags({
          is_loading: false,
          error: null,
          data: data.items
      });
    });
  }, [endpoint_url]);

  return autocomplete_tags;
}


export default useAutocompleteTags;
