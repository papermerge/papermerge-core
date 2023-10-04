import { Button } from "react-bootstrap"
import DocVersionsDropdown from '..//DocVersionsDropdown';
import UnappliedPageOpChanges from "./unapplied_page_op_changes"
import { DocumentVersion, DocumentType } from "types";
import DeletePages from "./DeletePages";
import RotateCw from "./RotateCw";
import RotateCcw from "./RotateCcw";


type Args = {
  versions: DocumentVersion[];
  doc: DocumentType | null | undefined;
  unapplied_page_op_changes: boolean;
  onDeletePages: () => void;
  onRotatePagesCw: () => void;
  onRotatePagesCcw: () => void;
  show_selected_menu: boolean;
  onApplyPageOpChanges: () => void;
}

export default function ActionPanel({
  versions,
  doc,
  unapplied_page_op_changes,
  show_selected_menu,
  onDeletePages,
  onRotatePagesCw,
  onRotatePagesCcw,
  onApplyPageOpChanges
}: Args) {

  const delete_pages = <DeletePages onClick={onDeletePages} />;
  const rotate_cw = <RotateCw onClick={onRotatePagesCw} />;
  const rotate_ccw = <RotateCcw onClick={onRotatePagesCcw} />;
  const extra_menu = <div>
    {delete_pages}
    {rotate_cw}
    {rotate_ccw}
  </div>;

  return (
    <div className="action-panel d-flex align-items-center">

      <Button className="m-1" variant="light">
        <i className="bi bi-pencil-square me-1"></i>
      </Button>

      <DocVersionsDropdown doc={doc} versions={versions}/>

      {show_selected_menu && extra_menu}

      {
        unapplied_page_op_changes &&
          <UnappliedPageOpChanges
            onClick={onApplyPageOpChanges}/>}
    </div>
  )
}
