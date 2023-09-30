import Dropdown from 'react-bootstrap/Dropdown';
import type { DocumentVersion } from "types";


type Args = {
  versions: DocumentVersion[];
}


function description(number: number, text: string): string {
  if (text) {
    return `Version ${number} - ${text}`;
  }

  return `Version ${number}`;
}


export default function DocVersionsDropdown({versions}: Args) {

  const dropdown_items = versions.map(
    item => <Dropdown.Item href={item.download_url}>
      {description(item.number, item.short_description)}
      </Dropdown.Item>
  );

  return (
    <Dropdown>
      <Dropdown.Toggle className="rounded-0 m-1" variant="success" id="dropdown-basic">
        <i className="bi bi-cloud-download me-1"></i>Download
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {dropdown_items}
      </Dropdown.Menu>
    </Dropdown>
  );
}
