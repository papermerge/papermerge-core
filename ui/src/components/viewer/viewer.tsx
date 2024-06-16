import { useEffect, useState, useRef } from 'react';
import Breadcrumb from 'components/breadcrumb/breadcrumb';

import { PagesPanel }  from "./pages_panel/pages_panel";
import { ThumbnailsPanel }  from "./thumbnails_panel/thumbnails_panel";
import { ThumbnailsToggle }  from "./thumbnails_panel/thumbnails_toggle";
import { useContentHeight } from 'hooks/content_height';
import useToast from 'hooks/useToasts';

import rename_node from 'components/modals/rename';
import websockets from 'services/ws';

import ActionPanel from "components/viewer/action_panel/action_panel";
import { NType, DocumentType, DocumentVersion, BreadcrumbType } from "types";
import type { Vow, PageAndRotOp, NodeType, BreadcrumbItemType, MovePagesBetweenDocsType, OcrStatusType, TargetFolder, MovedDocumentType, TargetDirection } from 'types';
import type { ThumbnailPageDroppedArgs, ShowDualButtonEnum } from 'types';
import type { DataTransferExtractedPages, OcrStatusEnum, Coord} from 'types';
import type { ExtractedPagesType } from 'types';
import ErrorMessage from 'components/error_message';
import { reorder as reorder_pages } from 'utils/array';
import { contains_every, uniq } from 'utils/array';

import { DATA_TRANSFER_EXTRACTED_PAGES, HIDDEN } from 'cconstants';
import { apply_page_op_changes } from 'requests/viewer';
import "./viewer.scss";
import move_pages from './modals/MovePages';
import move_document from './modals/MoveDocument';
import delete_document from './modals/DeleteDocument';
import extract_pages from 'components/modals/extract-pages/ExtractPages';
import view_ocr_text from './modals/ViewOCRText';
import run_ocr from './modals/RunOCR';
import { fetcher } from 'utils/fetcher';
import { last_version } from 'utils/misc';
import ContextMenu from './ContextMenu';



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
  dragged_pages: Array<string>;
  onNodeClick: (node: NType) => void;
  onPagesChange: (cur_pages: PageAndRotOp[]) => void;
  onExtractPages: (args: ExtractedPagesType) => void;
  onDocVersionsChange: (doc_versions: DocumentVersion[]) => void;
  onDocVerChange: (doc_versions: DocumentVersion) => void;
  onBreadcrumbChange: (new_breadcrumb: BreadcrumbType) => void;
  onMovePagesBetweenDocs: ({source, target}: MovePagesBetweenDocsType) => void;
  onSelectedPages: (arg: Array<string>) => void;
  onDraggedPages: (arg: Array<string>) => void;
  onDocumentMoved: (arg: MovedDocumentType) => void;
  onDocumentDelete: (arg: DocumentType) => void;
  show_dual_button?: ShowDualButtonEnum;
  target_folder?: TargetFolder | null;
  target_direction?: TargetDirection;
  target_equal_source_direction?: TargetDirection;
  onTargetEqualSourceClick?: (arg?: TargetDirection) => void;
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
  dragged_pages,
  onNodeClick,
  onPagesChange,
  onDocVersionsChange,
  onExtractPages,
  onDocVerChange,
  onBreadcrumbChange,
  onMovePagesBetweenDocs,
  onSelectedPages,
  onDraggedPages,
  onDocumentMoved,
  onDocumentDelete,
  show_dual_button,
  target_folder,
  target_direction,
  target_equal_source_direction,
  onTargetEqualSourceClick
}: Args) {
  const [ocr_status, setOCRStatus] = useState<OcrStatusEnum|null>(
    doc.data?.ocr_status || "UNKNOWN"
  )
  let [thumbnailsPanelVisible, setThumbnailsPanelVisible] = useState(true);
  let [unappliedPagesOpChanges, setUnappliedPagesOpChanges] = useState<boolean>(false);
  // currentPage = where to scroll into
  let [currentPage, setCurrentPage] = useState<number>(1);
  let viewer_content_height = useContentHeight();
  const [contextMenuPosition, setContextMenuPosition] = useState<Coord>(HIDDEN)
  const viewer_content_ref = useRef<HTMLInputElement>(null);
  const toasts = useToast();
  const ref = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // set height of the viewer content area to remaining
    // visible space (window_height - breadcrumb_height - top_nav_menu_height)
    if (viewer_content_ref?.current) {
      viewer_content_ref.current.style.height = `${viewer_content_height - /*just a guess*/ 50}px`;
    }
  }, [viewer_content_height]);

  useEffect(() => {
    if (!doc.data) {
      return;
    }

    websockets.addHandler(str_id(doc.data!.id), {callback: networkMessageHandler});

    setOCRStatus(doc.data.ocr_status);

    return () => {
      websockets.removeHandler(str_id(doc.data!.id));
    }
  }, [doc.data]);

  useEffect(() => {
    // detect right click outside
    if (ref.current) {
      ref.current.addEventListener('contextmenu', onContextMenu);
    }

    // When opening viewer reset list of selected pages,
    // overwise selected pages array carry across different document
    onSelectedPages([]);

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('contextmenu', onContextMenu);
      }
    }
  }, []);

  const networkMessageHandler = (data: any, ev: MessageEvent) => {
    if (data.kwargs.document_id == doc.data?.id) {
      setOCRStatus(data.state);
      if (data.state == 'SUCCESS') {
        // OCR completed with success => reload the document i.e. reload versions and pages
        reloadAfterOCRSuccess();
      }
    }
  }

  const onContextMenu = (ev: MouseEvent) => {
    ev.preventDefault(); // prevents default context menu

    let new_y = ev.clientY;
    let new_x = ev.clientX;

    setContextMenuPosition({y: new_y, x: new_x})
  }

  const hideContextMenu = () => {
    /**
     * Dropdown is always visible; "hide it" actually
     * moves it far away on the screen so that user does not see it.
     * This is because, if show/hide state is employed, then my guess
     * is that when hidden, react remove the dropdown element with its
     * events from the DOM, which result in "events not being fired"
     * */
    setContextMenuPosition(HIDDEN)
  }

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
      const new_pages = reorder_pages<PageAndRotOp, string>({
        arr: pages!.data!,
        source_ids: source_ids,
        target_id: target_id,
        position: position,
        idf: (val: PageAndRotOp) => val.page.id
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
      }).catch((error: Error) => {
        if (error) {
          toasts?.addToast(`error`, `Error while moving page(s): ${error}`)
        }
      });
    }
}

  const onApplyPageOpChanges = async () => {
    let _pages = pages!.data!.map(item => apply_page_type(item));
    try {
      let response = await apply_page_op_changes<ApplyPagesType[], DocumentVersion[]>(_pages);
      setUnappliedPagesOpChanges(false);
      onDocVersionsChange(response)
      onSelectedPages([]);

      toasts?.addToast("info", "Page operations successfully applied");
    } catch (error: any) {
      toasts?.addToast("error", `Error while reordering page(s) ${error}`);
    }
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
    ).catch((error?: Error) => {
      if (error) {
        toasts?.addToast("error", `Error while renaming: ${error}`);
      }
    });
  }

  const onDragStart = (item: PageAndRotOp, event: React.DragEvent) => {
    const all_sel_pages = [...selected_pages, item.page.id];
    const data_transfer: DataTransferExtractedPages = {
      pages: all_sel_pages,
      document_title: doc!.data!.title
    }

    event.dataTransfer.setData(
      DATA_TRANSFER_EXTRACTED_PAGES,
      JSON.stringify(data_transfer)
    )
  }

  const reloadAfterOCRSuccess = () => {
    fetcher(`/api/documents/${doc.data!.id}`)
    .then(
      data => {
        const _doc = data as DocumentType;
        const _last_ver = last_version(_doc.versions);

        onDocVersionsChange(_doc.versions);
        onPagesChange(
          _last_ver.pages.map(p => { return {angle: 0, page: p}})
        );
      }
    );
  }

  if (doc.error) {
    return <div className="viewer">
      {doc.error && <ErrorMessage msg={doc.error} />}
    </div>
  }

  const onLocalDrag = (item: PageAndRotOp, event: React.DragEvent) => {
    const _dragged_pages_ids = uniq([...selected_pages, item.page.id]);
    onDraggedPages(_dragged_pages_ids);
  }

  const onLocalDragStart = (item: PageAndRotOp, event: React.DragEvent) => {
    const _dragged_pages_ids = uniq([...selected_pages, item.page.id]);
    onDraggedPages(_dragged_pages_ids);
  }

  const onLocalDragEnd = (item: PageAndRotOp, event: React.DragEvent) => {
    onDraggedPages([]);
  }

  const onRunOCR = (_doc: DocumentType, _doc_ver: DocumentVersion) => {
    run_ocr(_doc, _doc_ver)
    .then(() => {})
    .catch((error: Error) => {
      toasts?.addToast('error', `Error while running OCR ${error}`);
    });
  }

  const onDocumentMoveTo = (target_folder: TargetFolder) => {
    move_document({doc: doc.data!, target_folder}).then(
      (arg: MovedDocumentType) => {
        onDocumentMoved(arg)
      }
    )
  }

  const onExtractPagesTo = (target_folder: TargetFolder) =>  {
    extract_pages({
      source_page_ids: selected_pages,
      target_folder: target_folder,
      document_title: doc.data!.title
    }).then((arg: ExtractedPagesType) => {
      onExtractPages(arg);
    }).catch((error: Error) => {
      if (error) {
        toasts?.addToast(`error`, `Error while extracting page(s) ${error}`);
      }
    });
  }

  const onLocalDocumentDelete = () => {
    delete_document(doc.data!).then(
      () => onDocumentDelete(doc.data!)
    )
  }

  const onViewOCRText = () => {
    view_ocr_text({doc_ver: doc_ver.data!, selected_pages}).then(
      () => {}
    );
  }

  return <div ref={ref} className="viewer w-100 m-1">
    <ActionPanel
      versions={doc_versions}
      doc={doc}
      ocr_status={ocr_status || "UNKNOWN"}
      selected_pages={selected_pages}
      onRenameClick={onRenameClick}
      onDeletePages={onDeletePages}
      onRotatePagesCw={onRotatePagesCw}
      onRotatePagesCcw={onRotatePagesCcw}
      unapplied_page_op_changes={unappliedPagesOpChanges}
      onApplyPageOpChanges={onApplyPageOpChanges}
      onRunOCR={onRunOCR}
      show_dual_button={show_dual_button}
      target_equal_source_direction={target_equal_source_direction}
      onTargetEqualSourceClick={onTargetEqualSourceClick} />
    <Breadcrumb path={breadcrumb?.data || []} onClick={onNodeClick} is_loading={false} />
    <div className="d-flex flex-row content" ref={viewer_content_ref}>
      <ThumbnailsPanel
        pages={pages}
        visible={thumbnailsPanelVisible}
        onClick={onPageThumbnailClick}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDrag={onLocalDrag}
        onDragEnd={onLocalDragEnd}
        dragged_pages={dragged_pages}
        onThumbnailPageDropped={onThumbnailPageDropped} />
      <ThumbnailsToggle
        onclick={onThumbnailsToggle}
        thumbnails_panel_visible={thumbnailsPanelVisible} />
      <PagesPanel
        items={pages}
        current_page_number={currentPage}/>
    </div>
    <ContextMenu
      position={contextMenuPosition}
      hideMenu={hideContextMenu}
      selected_pages={selected_pages}
      onDeletePages={onDeletePages}
      onExtractPagesTo={onExtractPagesTo}
      OnDocumentMoveTo={onDocumentMoveTo}
      OnDocumentDelete={onLocalDocumentDelete}
      OnRename={onRenameClick}
      OnViewOCRText={onViewOCRText}
      target_folder={target_folder}
      target_direction={target_direction} />
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


function str_id(node_id: string): string {
  return `document-ocr-status-${node_id}`;
}
