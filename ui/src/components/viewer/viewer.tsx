import { useEffect, useState, useRef } from 'react';
import { NodeClickArgsType, DocumentType, DocumentVersion } from "@/types";
import Breadcrumb from '../breadcrumb/breadcrumb';
import { Page }  from "./page";
import { fetcher } from '../../utils';
import { useViewerContentHeight } from '../../hooks/viewer_content_height';

import type { State } from '@/types';


type Args = {
  node_id: string;
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
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
  let viewer_content_height = useViewerContentHeight();
  const viewer_content_ref = useRef<HTMLInputElement>(null);


  useEffect(() => {
    // set height of the viewer content area to remaining
    // visible space (window_height - breadcrumb_height - top_nav_menu_height)
    if (viewer_content_ref?.current) {
      viewer_content_ref.current.style.height = `${viewer_content_height}px`;
    }
  }, [viewer_content_height]);

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

  return <div className="viewer">
    <Breadcrumb path={doc?.data?.breadcrumb || []} onClick={onNodeClick} is_loading={false} />
    <div className="d-flex flex-column content" ref={viewer_content_ref}>
      {curDocVer?.pages.map(page => <Page page={page} />)}
    </div>
  </div>;
}
