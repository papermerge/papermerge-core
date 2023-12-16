import type { User } from "./types";

type Args = {
  item: User;
}

export default function Row({
  item
  }: Args
) {

  return (
    <tr>
      <td className="text-left">
        {item.id}
      </td>
      <td className="text-center">
        {item.username}
      </td>
      <td className="text-center">
        {item.email}
      </td>
      <td className="text-center">
        {item.created_at}
      </td>
      <td className="text-center">
      </td>
    </tr>
  );
}
