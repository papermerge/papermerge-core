import Button  from 'react-bootstrap/Button';
import type { Group } from "./types";
import delete_group from './DeleteGroup';


type Args = {
  item: Group;
  onDelete: (group_id: number) => void;
  onEdit: (group_id: number) => void;
}

export default function Row({item, onDelete, onEdit}: Args
) {

  const onLocalDelete = () => {
    delete_group(item).then(
      group_id => onDelete(group_id)
    )
  }

  return (
    <tr>
      <td className="text-center">
        {item.name}
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
