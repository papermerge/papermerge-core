import Dropdown from 'react-bootstrap/Dropdown';
import type { DocumentVersion } from "types";
import { download_file } from 'utils/fetcher';


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

  const onClick = (href: string, file_name: string) => {
    download_file(href, file_name);
  }

  const dropdown_items = versions.map(
    item => <Dropdown.Item key={item.id} onClick={
      () => onClick(item.download_url, item.file_name)}>
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
