import { Spinner, Button } from "react-bootstrap";


type Args = {
  title: string;
  inProgress: boolean;
  onClick: () => void;
}


export default function SpinnerButton({title, inProgress, onClick}: Args) {
  if (inProgress) {
    return <Button disabled={true}>
      <Spinner size="sm" />
    </Button>
  }

  return <Button onClick={() => onClick()}>{title}</Button>
}
