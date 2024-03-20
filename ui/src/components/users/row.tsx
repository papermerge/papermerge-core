import Button from 'react-bootstrap/Button';
import type { User } from "./types";
import delete_user from './DeleteUser';
import useToast from 'hooks/useToasts';


type BooleanIconArgs = {
  value: boolean;
}


function BooleanIcon({value}: BooleanIconArgs) {
  if (value) {
    return <div className='text-success'>
      <i className='bi bi-check-lg'></i>
    </div>
  }

  return <div className='text-danger'>
    <i className='bi bi-x-lg'></i>
  </div>
}


type Args = {
  item: User;
  onDelete: (user_id: string) => void;
  onEdit: (user_id: string) => void;
}


export default function Row({item, onDelete, onEdit}: Args
) {

  const toasts = useToast();

  const onLocalDelete = () => {
    delete_user(item).then(
      user_id => onDelete(user_id)
    ).catch((error: Error) => {
      toasts?.addToast("error", `Error while deleting user: ${error.toString()}`);
    })
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
        <BooleanIcon value={item.is_superuser} />
      </td>
      <td className="text-center">
        <BooleanIcon value={item.is_active} />
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
