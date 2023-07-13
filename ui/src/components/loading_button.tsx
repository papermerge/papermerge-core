import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';


type Args = {
  in_progress: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
}


function SubmitButton({
  in_progress,
  title,
  onClick,
  className
}: Args) {

  if (!title) {
    title = "Submit";
  }

  if (in_progress) {
    return <Button onClick={onClick} disabled={true} className={className}>
        <Spinner size="sm" />
    </Button>;
  }

  return <Button onClick={onClick} className={className}>{title}</Button>;
}


export default SubmitButton;
