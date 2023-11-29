import { Button } from "react-bootstrap"
import DocVersionsDropdown from '../DocVersionsDropdown';
import UnappliedPageOpChanges from "./unapplied_page_op_changes"
import { DocumentVersion, DocumentType, ShowDualButtonEnum, CType } from "types";
import DeletePages from "./DeletePages";
import RotateCw from "./RotateCw";
import RotateCcw from "./RotateCcw";
import { DualButton } from "components/dual-panel/DualButton";
import type { OcrStatusEnum, TargetDirection, Vow } from "types";
import OcrStatus from "components/ocr_status";
import { last_version } from "utils/misc";
import { TargetEqualSource } from 'components/dual-panel/TargetEqualSource';


type Args = {
  versions: Vow<DocumentVersion[]>;
  doc: Vow<DocumentType>;
  ocr_status: OcrStatusEnum;
  unapplied_page_op_changes: boolean;
  onRenameClick: () => void;
  onDeletePages: () => void;
  onRotatePagesCw: () => void;
  onRotatePagesCcw: () => void;
  selected_pages: Array<string>;
  onApplyPageOpChanges: () => void;
  onRunOCR: (doc: DocumentType, doc_ver: DocumentVersion) => void;
  show_dual_button?: ShowDualButtonEnum;
  target_equal_source_direction?: TargetDirection;
  onTargetEqualSourceClick?: (arg?: TargetDirection) => void;
}

export default function ActionPanel({
  versions,
  doc,
  ocr_status,
  unapplied_page_op_changes,
  selected_pages,
  onRenameClick,
  onDeletePages,
  onRotatePagesCw,
  onRotatePagesCcw,
  onApplyPageOpChanges,
  onRunOCR,
  show_dual_button,
  target_equal_source_direction,
  onTargetEqualSourceClick
}: Args) {

  const delete_pages = <DeletePages onClick={onDeletePages} />;
  const rotate_cw = <RotateCw onClick={onRotatePagesCw} />;
  const rotate_ccw = <RotateCcw onClick={onRotatePagesCcw} />;
  const extra_menu = <div>
    {delete_pages}
    {rotate_cw}
    {rotate_ccw}
  </div>;

  const localRunOCR = () => {
    onRunOCR(doc.data!, last_version(versions.data!))
  }

  if (doc.is_pending) {
    return <div>Pending...</div>
  }

  if (doc.error) {
    return <div>Error {doc.error}</div>
  }

  if (!doc.data) {
    return <div>Received empty data</div>
  }

  return (
    <div className="action-panel d-flex justify-content-between">
      <div className="d-flex">
        <Button className="m-1" variant="light" onClick={onRenameClick}>
          <i className="bi bi-pencil-square me-1"></i>
        </Button>

        <DocVersionsDropdown doc={doc} versions={versions}/>

        <Button
          className="m-1"
          variant="light"
          onClick={localRunOCR}>
          <OcrStatus status={ocr_status} /> Run OCR
        </Button>

        {selected_pages.length > 0 ? extra_menu : ''}

        {
          unapplied_page_op_changes &&
            <UnappliedPageOpChanges
              onClick={onApplyPageOpChanges}/>}
        </div>
      <div>

        <TargetEqualSource
          direction={target_equal_source_direction}
          onTargetEqualSourceClick={onTargetEqualSourceClick} />

        <DualButton
          node={{id: doc.data.id, ctype: 'document'}}
          show_dual_button={show_dual_button} />
        </div>

    </div>
  )
}
