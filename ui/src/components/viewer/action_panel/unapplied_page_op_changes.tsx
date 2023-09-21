import { useState } from "react";
import { Button } from "react-bootstrap"


type Args = {
  onClick: () => void;
}

export default function UnappliedPageOpChanges({onClick}: Args) {
  const [inProgress, setInProgress] = useState(false);

  const onLocalClick = () => {
    onClick();
  }

  return (
    <span className="unapplied-page-op-changes">
      Unapplied pages operations detected
      <Button
        className="rounded-0 m-1" variant="success"
        onClick={onLocalClick}>
        Apply
      </Button>
    </span>
  );
}
