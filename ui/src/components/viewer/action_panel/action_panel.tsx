import { Button } from "react-bootstrap"
import DocVersionsDropdown from '../DocVersionsDropdown';
import UnappliedPageOpChanges from "./unapplied_page_op_changes"
import { DocumentVersion, DocumentType, ShowDualButtonEnum, CType } from "types";
import DeletePages from "./DeletePages";
import RotateCw from "./RotateCw";
import RotateCcw from "./RotateCcw";
import { DualButton } from "components/dual-panel/DualButton";


type Args = {
  versions: DocumentVersion[];
  doc: DocumentType | null | undefined;
  unapplied_page_op_changes: boolean;
  onRenameClick: () => void;
  onDeletePages: () => void;
  onRotatePagesCw: () => void;
  onRotatePagesCcw: () => void;
  show_selected_menu: boolean;
  onApplyPageOpChanges: () => void;
  show_dual_button?: ShowDualButtonEnum;
}

export default function ActionPanel({
  versions,
  doc,
  unapplied_page_op_changes,
  show_selected_menu,
  onRenameClick,
  onDeletePages,
  onRotatePagesCw,
  onRotatePagesCcw,
  onApplyPageOpChanges,
  show_dual_button
}: Args) {

  const delete_pages = <DeletePages onClick={onDeletePages} />;
  const rotate_cw = <RotateCw onClick={onRotatePagesCw} />;
  const rotate_ccw = <RotateCcw onClick={onRotatePagesCcw} />;
  const extra_menu = <div>
    {delete_pages}
    {rotate_cw}
    {rotate_ccw}
  </div>;

  console.log(`Viewer: show dual button = '${show_dual_button}'`);

  return (
    <div className="action-panel d-flex justify-content-between">
      <div className="d-flex">
        <Button className="m-1" variant="light" onClick={onRenameClick}>
          <i className="bi bi-pencil-square me-1"></i>
        </Button>

        <DocVersionsDropdown doc={doc} versions={versions}/>

        {show_selected_menu && extra_menu}

        {
          unapplied_page_op_changes &&
            <UnappliedPageOpChanges
              onClick={onApplyPageOpChanges}/>}
        </div>
      <div>
        <DualButton
          node_id={doc?.id}
          node_type={"document"}
          show_dual_button={show_dual_button} />
        </div>

    </div>
  )
}
