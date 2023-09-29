import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';


type Args = {
  in_progress: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
  variant?: string;
}


function LoadingButton({
  in_progress,
  title,
  onClick,
  className,
  variant
}: Args) {

  if (!title) {
    title = "Submit";
  }

  if (in_progress) {
    return <Button variant={variant} onClick={onClick} disabled={true} className={className}>
        <Spinner size="sm" />
    </Button>;
  }

  return <Button variant={variant} onClick={onClick} className={className}>{title}</Button>;
}


export default LoadingButton;
