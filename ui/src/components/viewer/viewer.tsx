import { useEffect, useState } from 'react';
import { NodeClickArgsType, DocumentType } from "@/types";
import Breadcrumb from '../breadcrumb/breadcrumb';
import { fetcher } from '../../utils';

type Args = {
  node_id: string;
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
}

type State<T> = {
  is_loading: boolean;
  error: unknown;
  data: T;
}

export default function Viewer(
  {node_id, onNodeClick}:  Args
) {

  const initial_breadcrumb_state: State<DocumentType | undefined> = {
    is_loading: true,
    error: null,
    data: undefined
  }
  let [doc, setDoc] = useState<State<DocumentType | undefined>>(initial_breadcrumb_state);

  useEffect(() => {
    fetcher(`/api/documents/${node_id}`)
    .then((json: DocumentType) => {
      let ready_state: State<DocumentType> = {
        is_loading: false,
        error: null,
        data: json
      };
      setDoc(ready_state);
    })
  }, []);

  return <>
    <Breadcrumb path={doc?.data?.breadcrumb || []} onClick={onNodeClick} is_loading={false} />
    <div>
      I am viewer
    </div>
  </>;
}
