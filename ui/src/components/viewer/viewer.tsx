import { useEffect, useState, useRef } from 'react';
import Breadcrumb from 'components/breadcrumb/breadcrumb';

import { PagesPanel }  from "./pages_panel/pages_panel";
import { ThumbnailsPanel }  from "./thumbnails_panel/thumbnails_panel";
import { ThumbnailsToggle }  from "./thumbnails_panel/thumbnails_toggle";
import { fetcher } from 'utils/fetcher';
import { useViewerContentHeight } from 'hooks/viewer_content_height';

import { NodeClickArgsType, DocumentType, DocumentVersion } from "types";
import type { PageOp } from 'types';
import type { State, PageType } from 'types';
import ErrorMessage from 'components/error_message';


type Args = {
  node_id: string;
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
}

export default function Viewer(
  {node_id, onNodeClick}:  Args
) {

  let [pagesOp, setPagesOp] = useState<Array<PageOp>>([]);
  let [thumbnailsPanelVisible, setThumbnailsPanelVisible] = useState(true);
  const initial_breadcrumb_state: State<DocumentType | undefined> = {
    is_loading: true,
    error: null,
    data: null
  }
  let [{is_loading, error, data}, setDoc] = useState<State<DocumentType | undefined>>(initial_breadcrumb_state);
  let [curDocVer, setCurDocVer] = useState<DocumentVersion | undefined>();
  let [currentPage, setCurrentPage] = useState<number>(1);
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

      let pages_op: Array<PageOp> = _setup_pages_op(last_version);
      setPagesOp(pages_op);

    }).catch((error: Error) => {
      setDoc({
        is_loading: false,
        error: error.toString(),
        data: null
      });
    });

  }, []);

  const onThumbnailsToggle = () => {
    setThumbnailsPanelVisible(!thumbnailsPanelVisible);
  }

  const onPageThumbnailClick = (page: PageType) => {
    console.log(`thumbnail clicked page.number=${page.number}`);
    setCurrentPage(page.number);
  }

  if (error) {
    return <div className="viewer">
      {error && <ErrorMessage msg={error} />}
    </div>
  }

  return <div className="viewer">
    <Breadcrumb path={data?.breadcrumb || []} onClick={onNodeClick} is_loading={false} />
    <div className="d-flex flex-row content" ref={viewer_content_ref}>
      <ThumbnailsPanel
        pages={curDocVer?.pages || []}
        visible={thumbnailsPanelVisible}
        onClick={onPageThumbnailClick} />
      <ThumbnailsToggle
        onclick={onThumbnailsToggle}
        thumbnails_panel_visible={thumbnailsPanelVisible} />
      <PagesPanel
        pages={curDocVer?.pages || []}
        current_page_number={currentPage}/>
    </div>
  </div>;
}


function _setup_pages_op(doc_ver: DocumentVersion): Array<PageOp> {
  /**
   * Setup page operation structure which will keep track of applied
   * operation on the pages (re-ordering, deletion and rotations).
   */
  let pages_op: Array<PageOp> = [];

  doc_ver.pages.forEach((page: PageType) =>{
    let item: PageOp = {
      old_page: {id: page.id, number: page.number},
      new_page: {id: page.id, number: page.number},
      ccw: 0
    };

    pages_op.push(item);
  });

  return pages_op;
}
