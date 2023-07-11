import type { ColoredTag } from "types";
import CheckIcon from "components/icons/check";
import XIcon from "components/icons/x";

import Tag from "./tag";

type Args = {
  item: ColoredTag;
}

export default function Row({item}: Args) {
  return (
    <tr>
      <td className="text-left">
        <Tag item={item} />
      </td>
      <td className="text-center">{item.pinned ? <CheckIcon /> : <XIcon />}</td>
      <td className="text-center">{item.description}</td>
      <td className="text-center">Edit Remove</td>
    </tr>
  );
}
