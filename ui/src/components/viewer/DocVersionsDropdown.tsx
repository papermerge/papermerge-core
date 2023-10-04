import Dropdown from 'react-bootstrap/Dropdown';
import type { DocumentVersion, DocumentType } from "types";
import { download_file } from 'utils/fetcher';


type Args = {
  versions: DocumentVersion[];
  doc: DocumentType | null | undefined;
}


function description(number: number, text: string): string {
  if (text) {
    return `Version ${number} - ${text}`;
  }

  return `Version ${number}`;
}


export default function DocVersionsDropdown({versions, doc}: Args) {

  const onClick = (href: string, file_name: string) => {
    download_file(href, doc?.title || file_name);
  }

  const dropdown_items = versions.map(
    item => <Dropdown.Item key={item.id} onClick={
      () => onClick(item.download_url, item.file_name)}>
        {description(item.number, item.short_description)}
      </Dropdown.Item>
  );

  return (
    <Dropdown>
      <Dropdown.Toggle className="m-1" variant="light" id="dropdown-basic">
        <i className="bi bi-cloud-download me-1"></i>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {dropdown_items}
      </Dropdown.Menu>
    </Dropdown>
  );
}
