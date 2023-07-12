import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';


type Args = {
  in_progress: boolean;
  title?: string;
  onClick: () => void;
}


function SubmitButton({
  in_progress,
  title,
  onClick
}: Args) {

  if (!title) {
    title = "Submit";
  }

  if (in_progress) {
    return <Button onClick={onClick} disabled={true}>
        <Spinner size="sm" />
    </Button>;
  }

  return <Button onClick={onClick}>{title}</Button>;
}


export default SubmitButton;
