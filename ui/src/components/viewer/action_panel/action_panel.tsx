import { Button } from "react-bootstrap"
import DocVersionsDropdown from '..//DocVersionsDropdown';
import UnappliedPageOpChanges from "./unapplied_page_op_changes"
import { DocumentVersion } from "types";

type Args = {
  versions: DocumentVersion[];
  unapplied_page_op_changes: boolean;
  onApplyPageOpChanges: () => void;
}

export default function ActionPanel({
  versions,
  unapplied_page_op_changes,
  onApplyPageOpChanges
}: Args) {
  return (
    <div className="action-panel d-flex">

      <Button className="rounded-0 m-1" variant="success">
        <i className="bi bi-pencil-square me-1"></i>Rename
      </Button>

      <DocVersionsDropdown versions={versions}/>
      {
        unapplied_page_op_changes &&
          <UnappliedPageOpChanges
            onClick={onApplyPageOpChanges}/>}
    </div>
  )
}
