import LoadingButton from "components/loading_button";
import { useState } from "react";


type Args = {
  onClick: () => void;
}

export default function UnappliedPageOpChanges({onClick}: Args) {
  const [inProgress, setInProgress] = useState(false);

  const onLocalClick = async () => {
    setInProgress(true);
    onClick();
    setInProgress(false);
  }

  return (
    <span className="unapplied-page-op-changes">
      <LoadingButton in_progress={inProgress}
          variant={"success"}
          title={"Apply Page Operations"}
          className="rounded-0 m-1"
          onClick={onLocalClick} />
    </span>
  );
}
