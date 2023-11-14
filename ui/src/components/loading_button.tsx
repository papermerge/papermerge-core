import { forwardRef } from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';


type Args = {
  in_progress: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
  variant?: string;
}


const LoadingButton = forwardRef<HTMLButtonElement, Args>((props, ref) =>  {

  if (props.in_progress) {
    return <Button ref={ref} variant={props.variant} onClick={props.onClick} disabled={true} className={props.className}>
        <Spinner size="sm" />
    </Button>;
  }

  return <Button
    ref={ref}
    variant={props.variant}
    onClick={props.onClick}
    className={props.className}>{props.title || "Submit"}
  </Button>;
});


export default LoadingButton;
