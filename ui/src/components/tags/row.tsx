import type { ColoredTag } from "types";

type Args = {
  item: ColoredTag;
}

export default function Tag({item}: Args) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.pinned}</td>
      <td>{item.description}</td>
      <td>Edit Remove</td>
    </tr>
  );
}
