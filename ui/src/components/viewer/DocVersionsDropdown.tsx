import Dropdown from 'react-bootstrap/Dropdown';
import type { DocumentVersion, DocumentType } from "types";
import { download_file } from 'utils/fetcher';
import type { Vow } from 'types';
import useToast from 'hooks/useToasts';


type Args = {
  versions: Vow<DocumentVersion[]>;
  doc: Vow<DocumentType>;
}


function description(number: number, text: string): string {
  if (text) {
    return `Version ${number} - ${text}`;
  }

  return `Version ${number}`;
}


export default function DocVersionsDropdown({versions, doc}: Args) {
  const toasts = useToast();

  const onClick = (href: string, file_name: string) => {
    download_file(href, file_name).catch(
      (error: Error) => {
         toasts?.addToast(`error`, `Error while downloading ${error}`);
      }
    );
  }

  if (doc.is_pending) {
    return <div>Doc Pending...</div>
  }

  if (doc.error) {
    return <div>Doc Error {doc.error}</div>
  }

  if (versions.is_pending) {
    return <div>Versions pending...</div>
  }

  if (versions.error) {
    return <div>Versions error {versions.error}</div>
  }

  if (!versions.data) {
    return <div>Received empty versions data</div>
  }

  const dropdown_items = versions.data.map(
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
