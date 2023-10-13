import { NType } from "types";
import IconHouse from 'components/icons/house';
import IconInbox from "components/icons/inbox";


type Args = {
  node_id: string;
  node_title: string
  onClick: (node: NType) => void;
  active: boolean;
}

export default function BreadcrumbItem({node_id, node_title, onClick, active}: Args) {

  if (node_title === ".home") {
      return (
        <li className="breadcrumb-item active">
          <a href="#" onClick={() => onClick({id: node_id, ctype: "folder"})}>
              <IconHouse /> Home
          </a>
        </li>
      );
  }

  if (node_title === ".inbox") {
    return (
      <li className="breadcrumb-item active">
        <a href="#" onClick={() => onClick({id: node_id, ctype: "folder"})}>
            <IconInbox /> Inbox
        </a>
      </li>
    );
  }

  if (active) {
    return (
      <li className="breadcrumb-item active">{node_title}</li>
    );
  }

  return (
    <li className="breadcrumb-item">
      <a href="#" onClick={() => onClick({id: node_id, ctype: "folder"})}>
          {node_title}
      </a>
    </li>
  )
}
