import Button from 'react-bootstrap/Button';
import type { User } from "./types";

type Args = {
  item: User;
  onDelete: (user_id: string) => void;
  onEdit: (user_id: string) => void;
}

export default function Row({item, onDelete, onEdit}: Args
) {

  const onLocalDelete = () => {
  }

  return (
    <tr>
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
        <Button
          onClick={() => onEdit(item.id)}
          variant="link">Edit
        </Button>
        <Button
          onClick={onLocalDelete}
          className='text-danger'
          variant="link">
            Delete
        </Button>
      </td>
    </tr>
  );
}
