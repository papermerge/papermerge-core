import { useState, useEffect } from "react";
import type { DocumentType, DocumentVersion, NType, Vow } from "types"

import { fetcher } from "utils/fetcher";

type Args = {
  node: NType | null;
}


function useDoc({node}: Args): [Vow<DocumentType>, React.Dispatch<Vow<DocumentType>>] {
  let [data, setData] = useState<Vow<DocumentType>>({
    is_pending: true,
    loading_id: node?.id,
    error: null,
    data: null
  });

  useEffect(() => {
    if (!node) {
      return;
    }

    if (node.ctype == 'folder') {
      return;
    }

    const loading_state: Vow<DocumentType> = {
      is_pending: true,
      loading_id: node?.id,
      error: null,
      data: data.data
    };
    setData(loading_state);

    let ignore = false;

    fetcher(`/api/documents/${node.id}`)
    .then((data: DocumentType) => {
      if (!ignore) {
        let ready_state: Vow<DocumentType> = {
          is_pending: false,
          error: null,
          data: data
        };

        setData(ready_state);
      }
    }) // end of then
    .catch((error: Error) => {
      setData({
        is_pending: false,
        error:  error.toString(),
        data: null
      });
    });

    return () => {
      ignore = true;
    };

  }, [node?.id]); // end of useEffect

  return [data, setData];
}


export default useDoc;
