import { useState } from "react";
import { Button, Spinner } from "react-bootstrap"


type Args = {
  onClick: () => void;
}

export default function UnappliedPageOpChanges({onClick}: Args) {
  const [inProgress, setInProgress] = useState(false);

  const onLocalClick = () => {
    setInProgress(true);
    onClick();
  }

  return (
    <span className="unapplied-page-op-changes">
      Unapplied pages operations detected
      <Button disabled={inProgress}
        className="rounded-0 m-1" variant="success"
        onClick={onLocalClick}>
        {inProgress && <Spinner />} Apply
      </Button>
    </span>
  );
}
