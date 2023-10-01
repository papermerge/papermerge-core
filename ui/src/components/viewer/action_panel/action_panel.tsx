import { Button } from "react-bootstrap"
import DocVersionsDropdown from '..//DocVersionsDropdown';
import UnappliedPageOpChanges from "./unapplied_page_op_changes"
import { DocumentVersion, DocumentType } from "types";

type Args = {
  versions: DocumentVersion[];
  doc: DocumentType | null | undefined;
  unapplied_page_op_changes: boolean;
  onApplyPageOpChanges: () => void;
}

export default function ActionPanel({
  versions,
  doc,
  unapplied_page_op_changes,
  onApplyPageOpChanges
}: Args) {
  return (
    <div className="action-panel d-flex">

      <Button className="rounded-0 m-1" variant="success">
        <i className="bi bi-pencil-square me-1"></i>Rename
      </Button>

      <DocVersionsDropdown doc={doc} versions={versions}/>
      {
        unapplied_page_op_changes &&
          <UnappliedPageOpChanges
            onClick={onApplyPageOpChanges}/>}
    </div>
  )
}
