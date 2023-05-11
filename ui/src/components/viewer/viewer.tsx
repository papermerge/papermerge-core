import { useEffect, useState } from 'react';
import { NodeClickArgsType, DocumentType, DocumentVersion } from "@/types";
import Breadcrumb from '../breadcrumb/breadcrumb';
import { Page }  from "./page";
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
  let [curDocVer, setCurDocVer] = useState<DocumentVersion | undefined>();

  useEffect(() => {

    fetcher(`/api/documents/${node_id}`)
    .then((data: DocumentType) => {
      let ready_state: State<DocumentType> = {
        is_loading: false,
        error: null,
        data: data
      };

      setDoc(ready_state);

      let last_version = data.versions.reduce((prev: DocumentVersion, cur: DocumentVersion) => {
        if (prev && prev.number > cur.number) {
          return prev;
        }

        return cur;
      });

      setCurDocVer(last_version);
    });

  }, []);

  return <>
    <Breadcrumb path={doc?.data?.breadcrumb || []} onClick={onNodeClick} is_loading={false} />
    <div>
      {curDocVer?.number}
      {curDocVer?.pages.map(page => <Page page={page} />)}
    </div>
  </>;
}
