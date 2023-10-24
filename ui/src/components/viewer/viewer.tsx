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
import type { Vow, PageAndRotOp, NodeType, BreadcrumbItemType, MovePagesBetweenDocsType } from 'types';
import type { ThumbnailPageDroppedArgs, ShowDualButtonEnum } from 'types';
import ErrorMessage from 'components/error_message';
import { reorder_pages } from 'utils/misc';
import { contains_every } from 'utils/array';

import { DATA_TYPE_PAGES } from './thumbnails_panel/constants';
import { apply_page_op_changes } from 'requests/viewer';
import "./viewer.scss";
import move_pages from './modals/MovePages';


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
  selected_pages: Array<string>;
  onNodeClick: (node: NType) => void;
  onPagesChange: (cur_pages: PageAndRotOp[]) => void;
  onDocVersionsChange: (doc_versions: DocumentVersion[]) => void;
  onDocVerChange: (doc_versions: DocumentVersion) => void;
  onBreadcrumbChange: (new_breadcrumb: BreadcrumbType) => void;
  onMovePagesBetweenDocs: ({source, target}: MovePagesBetweenDocsType) => void;
  onSelectedPages: (arg: Array<string>) => void;
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
  selected_pages,
  onNodeClick,
  onPagesChange,
  onDocVersionsChange,
  onDocVerChange,
  onBreadcrumbChange,
  onMovePagesBetweenDocs,
  onSelectedPages,
  show_dual_button
}: Args) {

  let [thumbnailsPanelVisible, setThumbnailsPanelVisible] = useState(true);
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
    source_ids,
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
   if (contains_every({
        container: pages!.data!.map(
          i => i.page.id
        ),  // all pages IDs of target doc ver
        items: source_ids // all source pages (their IDs)
    })) {
      /* Here we deal with page transfer is within the same document
        i.e we just reordering. It is so because all source pages (their IDs)
        were found in the target document version.
      */
      const new_pages = reorder_pages({
        arr: pages!.data!,
        source_ids: source_ids,
        target_id: target_id,
        position: position
      });
      if (!new_pages.every((value, index) => value.page.id == pages!.data![index].page.id)) {
        setUnappliedPagesOpChanges(true);
      }
      onPagesChange(new_pages);
    } else {
      // here we deal with pages being moved between different
      // documents
      move_pages({
        source_page_ids: source_ids,
        target_page_id: target_id,
        target_doc_title: doc!.data!.title
      }).then(({source, target}: MovePagesBetweenDocsType) => {
        onMovePagesBetweenDocs({source, target});
        onSelectedPages([]);
      });
    }
}

  const onApplyPageOpChanges = async () => {
    let _pages = pages!.data!.map(item => apply_page_type(item));
    let response = await apply_page_op_changes<ApplyPagesType[], DocumentVersion[]>(_pages);
    setUnappliedPagesOpChanges(false);
    onDocVersionsChange(response)
    onSelectedPages([]);

    toasts?.addToast("info", "Page operations successfully applied");
  }


  const onSelect = (page_id: string, selected: boolean) => {
    let new_list: Array<string>;

    if (selected) {
      new_list = [...selected_pages, page_id]
    } else {
      new_list = selected_pages.filter(id => id != page_id);
    }

    // here `selected` is false
    onSelectedPages(new_list);
  }

  const onDeletePages = () => {
    let new_cur_pages = pages!.data!.filter(
      (item: PageAndRotOp) => selected_pages.indexOf(item.page.id) < 0
    );
    setUnappliedPagesOpChanges(true);
    onSelectedPages([]);
    onPagesChange(new_cur_pages);
  }

  const onRotatePagesCcw = () => {
    let new_array: Array<PageAndRotOp> = [];
    let change = false;

    new_array = pages!.data!.map(
      (item: PageAndRotOp) => {
        if (selected_pages.indexOf(item.page.id) >= 0) {
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
        if (selected_pages.indexOf(item.page.id) >= 0) {
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

  const onDragStart = (item: PageAndRotOp, event: React.DragEvent) => {
    const _sel_pages = pages!.data!.filter(
      i => selected_pages.includes(i.page.id)
    );
    const all_sel_pages = [..._sel_pages, item];

    event.dataTransfer.setData(
      DATA_TYPE_PAGES,
      JSON.stringify(all_sel_pages)
    )
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
      selected_pages={selected_pages}
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
        onDragStart={onDragStart}
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
