import type { ColoredTag } from "types";

import Tag from "./tag";

type Args = {
  item: ColoredTag;
  onEdit: (item: ColoredTag) => void;
  onRemove: (item: ColoredTag) => void;
}

function XIcon() {
  return <h3><i className="bi bi-x text-danger"></i></h3>;
}


function CheckIcon() {
  return <h3><i className='bi bi-check text-success'></i></h3>;
};


export default function Row({item, onEdit, onRemove}: Args) {
  return (
    <tr>
      <td className="text-left">
        <Tag item={item} />
      </td>
      <td className="text-center">
        {item.pinned ? <CheckIcon /> : <XIcon />}
      </td>
      <td className="text-center">
        {item.description}
      </td>
      <td className="text-center">
        <a href='#' onClick={() => onEdit(item)} className="m-1">
          Edit
        </a>
        <a href='#' onClick={() => onRemove(item)} className="m-1">
          Remove
        </a>
      </td>
    </tr>
  );
}
