import { Button } from "react-bootstrap"
import UnappliedPageOpChanges from "./unapplied_page_op_changes"

type Args = {
  unapplied_page_op_changes: boolean;
  onApplyPageOpChanges: () => void;
}

export default function ActionPanel({
  unapplied_page_op_changes,
  onApplyPageOpChanges
}: Args) {
  return (
    <div className="action-panel">
      <Button className="rounded-0 m-1" variant="success">
        <i className="bi bi-pencil-square me-1"></i>Rename
      </Button>
      <Button className="rounded-0 m-1" variant="success">
        <i className="bi bi-cloud-download me-1"></i>Download
      </Button>
      {
        unapplied_page_op_changes &&
          <UnappliedPageOpChanges
            onClick={onApplyPageOpChanges}/>}
    </div>
  )
}
