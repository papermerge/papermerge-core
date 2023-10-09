import { Spinner, Button } from "react-bootstrap";


type Args = {
  title: string;
  inProgress: boolean;
  variant?: string;
  onClick: () => void;
}


export default function SpinnerButton({title, variant, inProgress, onClick}: Args) {
  if (!variant) {
    variant = 'primary';
  }

  if (inProgress) {
    return <Button variant={variant} disabled={true}>
      <Spinner size="sm" />
    </Button>
  }

  return <Button variant={variant} onClick={() => onClick()}>{title}</Button>
}
