import Button  from 'react-bootstrap/Button';
import type { Group } from "./types";
import delete_group from './DeleteGroup';
import useToast from 'hooks/useToasts';

type Args = {
  item: Group;
  onDelete: (group_id: number) => void;
  onEdit: (group_id: number) => void;
}

export default function Row({item, onDelete, onEdit}: Args
) {

  const toasts = useToast();

  const onLocalDelete = () => {
    delete_group(item).then(
      group_id => onDelete(group_id)
    ).catch((error?: Error) => {
      if (error) {
        toasts?.addToast("error", `Error while deleting group: ${error.toString()}`);
      }
    })
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
