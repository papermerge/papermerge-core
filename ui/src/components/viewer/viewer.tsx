import { useEffect, useState, useRef } from 'react';
import Breadcrumb from 'components/breadcrumb/breadcrumb';

import { PagesPanel }  from "./pages_panel/pages_panel";
import { ThumbnailsPanel }  from "./thumbnails_panel/thumbnails_panel";
import { ThumbnailsToggle }  from "./thumbnails_panel/thumbnails_toggle";
import { fetcher } from 'utils/fetcher';
import { useViewerContentHeight } from 'hooks/viewer_content_height';

import ActionPanel from "components/viewer/action_panel";
import { NodeClickArgsType, DocumentType, DocumentVersion } from "types";
import type { PageAndRotOp } from 'types';
import type { State, ThumbnailPageDroppedArgs } from 'types';
import ErrorMessage from 'components/error_message';
import { reorder_pages } from 'utils/misc';


type Args = {
  node_id: string;
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
}

export default function Viewer(
  {node_id, onNodeClick}:  Args
) {

  let [thumbnailsPanelVisible, setThumbnailsPanelVisible] = useState(true);
  const initial_breadcrumb_state: State<DocumentType | undefined> = {
    is_loading: true,
    error: null,
    data: null
  }
  let [{is_loading, error, data}, setDoc] = useState<State<DocumentType | undefined>>(initial_breadcrumb_state);
  let [curDocVer, setCurDocVer] = useState<DocumentVersion | undefined>();
  let [curPages, setCurPages] = useState<Array<PageAndRotOp>>([]);
  let [unappliedPagesOpChanges, setUnappliedPagesOpChanges] = useState<boolean>(false);
  // currentPage = where to scroll into
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
      setCurPages(last_version.pages.map(p => { return {page: p, ccw: 0};}));
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

  const onPageThumbnailClick = (item: PageAndRotOp) => {
    setCurrentPage(item.page.number);
  }

  const onThumbnailPageDropped = ({
    source_id,
    target_id,
    position
  }: ThumbnailPageDroppedArgs) => {
    /*
      Triggered when page thumbnail is dropped

      source_id = is the id of the page which was dragged and dropped
      target_id = is the id of the page over which source was dropped
      position = should source page be inserted before or after the target?
      Method is triggered only when source_id != target_id.
    */
    const new_pages = reorder_pages({
      arr: curPages,
      source_id: source_id,
      target_id: target_id,
      position: position
    });
    if (!new_pages.every((value, index) => value.page.id == curPages[index].page.id)) {
      setUnappliedPagesOpChanges(true);
    }
    setCurPages(new_pages);
  }

  if (error) {
    return <div className="viewer">
      {error && <ErrorMessage msg={error} />}
    </div>
  }

  return <div className="viewer">
    <ActionPanel />
    <Breadcrumb path={data?.breadcrumb || []} onClick={onNodeClick} is_loading={false} />
    <div className="d-flex flex-row content" ref={viewer_content_ref}>
      <ThumbnailsPanel
        pages={curPages}
        visible={thumbnailsPanelVisible}
        onClick={onPageThumbnailClick}
        onThumbnailPageDropped={onThumbnailPageDropped} />
      <ThumbnailsToggle
        onclick={onThumbnailsToggle}
        thumbnails_panel_visible={thumbnailsPanelVisible} />
      <PagesPanel
        items={curPages}
        current_page_number={currentPage}/>
    </div>
  </div>;
}
