import { useEffect, useState, useRef } from 'react';
import Breadcrumb from 'components/breadcrumb/breadcrumb';

import { PagesPanel }  from "./pages_panel/pages_panel";
import { ThumbnailsPanel }  from "./thumbnails_panel/thumbnails_panel";
import { ThumbnailsToggle }  from "./thumbnails_panel/thumbnails_toggle";
import { fetcher } from 'utils/fetcher';
import { useViewerContentHeight } from 'hooks/viewer_content_height';
import useToast from 'hooks/useToasts';


import ActionPanel from "components/viewer/action_panel/action_panel";
import { NodeClickArgsType, DocumentType, DocumentVersion } from "types";
import type { PageAndRotOp, CType } from 'types';
import type { State, ThumbnailPageDroppedArgs, ShowDualButtonEnum } from 'types';
import ErrorMessage from 'components/error_message';
import { reorder_pages } from 'utils/misc';

import { apply_page_op_changes } from 'requests/viewer';
import "./viewer.scss";


type ShortPageType = {
  number: number;
  id: string;
}


type ApplyPagesType = {
  angle: number;
  page: ShortPageType;
}


type Args = {
  node_id: string;
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
  show_dual_button?: ShowDualButtonEnum;
}

function apply_page_type(item: PageAndRotOp): ApplyPagesType {
  return {
    angle: item.angle,
    page: {id: item.page.id, number: item.page.number}
  }
}

export default function Viewer({node_id,
  onNodeClick,
  show_dual_button
}: Args) {

  let [thumbnailsPanelVisible, setThumbnailsPanelVisible] = useState(true);
  const initial_breadcrumb_state: State<DocumentType | undefined> = {
    is_loading: true,
    error: null,
    data: null
  }
  let [{is_loading, error, data}, setDoc] = useState<State<DocumentType | undefined>>(initial_breadcrumb_state);
  let [curDocVer, setCurDocVer] = useState<DocumentVersion | undefined>();
  // current doc versions
  let [docVers, setDocVers] = useState<DocumentVersion[]>([]);
  let [curPages, setCurPages] = useState<Array<PageAndRotOp>>([]);
  let [showSelectedMenu, setShowSelectedMenu] = useState<boolean>(false);
  let [selectedPages, setSelectedPages] = useState<Array<string>>([]);
  let [unappliedPagesOpChanges, setUnappliedPagesOpChanges] = useState<boolean>(false);
  // currentPage = where to scroll into
  let [currentPage, setCurrentPage] = useState<number>(1);
  let viewer_content_height = useViewerContentHeight();
  const viewer_content_ref = useRef<HTMLInputElement>(null);
  const toasts = useToast();


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
      setDocVers(data.versions);

      let last_version = data.versions.reduce((prev: DocumentVersion, cur: DocumentVersion) => {
        if (prev && prev.number > cur.number) {
          return prev;
        }

        return cur;
      });

      setCurDocVer(last_version);
      setCurPages(last_version.pages.map(p => { return {page: p, angle: 0};}));
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

  const onApplyPageOpChanges = async () => {
    let pages = curPages.map(item => apply_page_type(item));
    let response = await apply_page_op_changes<ApplyPagesType[], DocumentVersion[]>(pages);
    setUnappliedPagesOpChanges(false);
    setDocVers(response);
    setSelectedPages([]);

    toasts?.addToast("Page operations successfully applied");
  }

  const onSelect = (page_id: string, selected: boolean) => {
    let new_list: Array<string>;

    if (selected) {
      new_list = [...selectedPages, page_id]
    } else {
      new_list = selectedPages.filter(id => id != page_id);
    }

    if (new_list.length > 0) {
      setShowSelectedMenu(true);
    } else {
      setShowSelectedMenu(false);
    }

    // here `selected` is false
    setSelectedPages(new_list);
  }

  const onDeletePages = () => {
    let new_cur_pages = curPages.filter(
      (item: PageAndRotOp) => selectedPages.indexOf(item.page.id) < 0
    );
    setCurPages(new_cur_pages);
    setShowSelectedMenu(false);
    setUnappliedPagesOpChanges(true);
    setSelectedPages([]);
  }

  const onRotatePagesCcw = () => {
    let new_array: Array<PageAndRotOp> = [];
    let change = false;

    new_array = curPages.map(
      (item: PageAndRotOp) => {
        if (selectedPages.indexOf(item.page.id) >= 0) {
          item.angle -= 90;
          // @ts-ignore
          item.angle = item.angle % 360;
          change = true;
        }
        return item;
      }
    );

    if (change) {
      setCurPages(new_array);
      setUnappliedPagesOpChanges(true);
    }
  }

  const onRotatePagesCw = () => {
    let new_array: Array<PageAndRotOp> = [];
    let change = false;

    new_array = curPages.map(
      (item: PageAndRotOp) => {
        if (selectedPages.indexOf(item.page.id) >= 0) {
          item.angle += 90;
          // @ts-ignore
          item.angle = item.angle % 360;
          change = true;
        }

        return item;
      }
    );
    if (change) {
      setCurPages(new_array);
      setUnappliedPagesOpChanges(true);
    }
  }

  if (error) {
    return <div className="viewer">
      {error && <ErrorMessage msg={error} />}
    </div>
  }

  return <div className="viewer w-100 m-1">
    <ActionPanel
      versions={docVers}
      doc={data}
      show_selected_menu={showSelectedMenu}
      onDeletePages={onDeletePages}
      onRotatePagesCw={onRotatePagesCw}
      onRotatePagesCcw={onRotatePagesCcw}
      unapplied_page_op_changes={unappliedPagesOpChanges}
      onApplyPageOpChanges={onApplyPageOpChanges}
      show_dual_button={show_dual_button} />
    <Breadcrumb path={data?.breadcrumb || []} onClick={onNodeClick} is_loading={false} />
    <div className="d-flex flex-row content" ref={viewer_content_ref}>
      <ThumbnailsPanel
        pages={curPages}
        visible={thumbnailsPanelVisible}
        onClick={onPageThumbnailClick}
        onSelect={onSelect}
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
