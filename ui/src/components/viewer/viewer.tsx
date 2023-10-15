import { useEffect, useState, useRef } from 'react';
import Breadcrumb from 'components/breadcrumb/breadcrumb';

import { PagesPanel }  from "./pages_panel/pages_panel";
import { ThumbnailsPanel }  from "./thumbnails_panel/thumbnails_panel";
import { ThumbnailsToggle }  from "./thumbnails_panel/thumbnails_toggle";
import { useViewerContentHeight } from 'hooks/viewer_content_height';
import useToast from 'hooks/useToasts';

import rename_node from 'components/modals/rename';
import ActionPanel from "components/viewer/action_panel/action_panel";
import { NType, DocumentType, DocumentVersion, BreadcrumbType } from "types";
import type { Vow, PageAndRotOp, NodeType, BreadcrumbItemType } from 'types';
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
  doc: Vow<DocumentType>;
  doc_versions: Vow<DocumentVersion[]>;
  doc_ver: Vow<DocumentVersion>;
  breadcrumb: Vow<BreadcrumbType>;
  pages: Vow<PageAndRotOp[]>;
  onNodeClick: (node: NType) => void;
  onPagesChange: (cur_pages: PageAndRotOp[]) => void;
  onDocVersionsChange: (doc_versions: DocumentVersion[]) => void;
  onDocVerChange: (doc_versions: DocumentVersion) => void;
  onBreadcrumbChange: (new_breadcrumb: BreadcrumbType) => void;
  show_dual_button?: ShowDualButtonEnum;
}

function apply_page_type(item: PageAndRotOp): ApplyPagesType {
  return {
    angle: item.angle,
    page: {id: item.page.id, number: item.page.number}
  }
}

export default function Viewer({
  node_id,
  doc,
  doc_versions,
  doc_ver,
  breadcrumb,
  pages,
  onNodeClick,
  onPagesChange,
  onDocVersionsChange,
  onDocVerChange,
  onBreadcrumbChange,
  show_dual_button
}: Args) {

  let [thumbnailsPanelVisible, setThumbnailsPanelVisible] = useState(true);
  // current doc versions
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
      arr: pages!.data!,
      source_id: source_id,
      target_id: target_id,
      position: position
    });
    if (!new_pages.every((value, index) => value.page.id == pages!.data![index].page.id)) {
      setUnappliedPagesOpChanges(true);
    }
    onPagesChange(new_pages);
  }

  const onApplyPageOpChanges = async () => {
    let _pages = pages!.data!.map(item => apply_page_type(item));
    let response = await apply_page_op_changes<ApplyPagesType[], DocumentVersion[]>(_pages);
    setUnappliedPagesOpChanges(false);
    onDocVersionsChange(response)
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
    let new_cur_pages = pages!.data!.filter(
      (item: PageAndRotOp) => selectedPages.indexOf(item.page.id) < 0
    );
    onPagesChange(new_cur_pages);
    setShowSelectedMenu(false);
    setUnappliedPagesOpChanges(true);
    setSelectedPages([]);
  }

  const onRotatePagesCcw = () => {
    let new_array: Array<PageAndRotOp> = [];
    let change = false;

    new_array = pages!.data!.map(
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
      onPagesChange(new_array);
      setUnappliedPagesOpChanges(true);
    }
  }

  const onRotatePagesCw = () => {
    let new_array: Array<PageAndRotOp> = [];
    let change = false;

    new_array = pages!.data!.map(
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
      onPagesChange(new_array);
      setUnappliedPagesOpChanges(true);
    }
  }

  const onRenameClick = () => {
    rename_node(doc!.data!.id, get_doc_title(breadcrumb!.data!))
    .then(
      (node: NodeType) => {
        let new_breadcrumb: BreadcrumbType = breadcrumb!.data!.map((item: BreadcrumbItemType) => {
          if (item[0] == node.id) {
            return [item[0], node.title];
          }

          return item;
        }) as BreadcrumbType;

        onBreadcrumbChange(new_breadcrumb);
      }
    );
  }

  if (doc.error) {
    return <div className="viewer">
      {doc.error && <ErrorMessage msg={doc.error} />}
    </div>
  }

  return <div className="viewer w-100 m-1">
    <ActionPanel
      versions={doc_versions}
      doc={doc}
      show_selected_menu={showSelectedMenu}
      onRenameClick={onRenameClick}
      onDeletePages={onDeletePages}
      onRotatePagesCw={onRotatePagesCw}
      onRotatePagesCcw={onRotatePagesCcw}
      unapplied_page_op_changes={unappliedPagesOpChanges}
      onApplyPageOpChanges={onApplyPageOpChanges}
      show_dual_button={show_dual_button} />
    <Breadcrumb path={breadcrumb?.data || []} onClick={onNodeClick} is_loading={false} />
    <div className="d-flex flex-row content" ref={viewer_content_ref}>
      <ThumbnailsPanel
        pages={pages}
        visible={thumbnailsPanelVisible}
        onClick={onPageThumbnailClick}
        onSelect={onSelect}
        onThumbnailPageDropped={onThumbnailPageDropped} />
      <ThumbnailsToggle
        onclick={onThumbnailsToggle}
        thumbnails_panel_visible={thumbnailsPanelVisible} />
      <PagesPanel
        items={pages}
        current_page_number={currentPage}/>
    </div>
  </div>;
}


function get_doc_title(breadcrumb: BreadcrumbType): string {
  /* breadcrumb is stored as list of tuples:

    [[id, title], [id, title], [id, title], ...]
  */
  if (breadcrumb.length >= 1) {
    const last = breadcrumb[breadcrumb.length - 1];
    return last[1]; // get the title part i.e. second element in the tuple
  }

  return '';
}
