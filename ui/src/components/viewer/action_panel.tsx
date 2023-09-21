import { Button } from "react-bootstrap"


export default function ActionPanel() {
  return (
    <div>
      <Button className="rounded-0 m-1" variant="success">
        <i className="bi bi-pencil-square me-1"></i>Rename
      </Button>
      <Button className="rounded-0 m-1" variant="success">
        <i className="bi bi-cloud-download me-1"></i>Download
      </Button>
    </div>
  )
}
