import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectCurrentUserStatus,
  selectCurrentUserError,
} from "@/slices/currentUser.ts";
import type { User } from "@/types.ts";

function Topbar() {
  const user = useSelector(selectCurrentUser) as User;
  const status = useSelector(selectCurrentUserStatus);
  const error = useSelector(selectCurrentUserError);

  if (status == "loading") {
    return <>Loading...</>;
  }

  if (status == "failed") {
    return <>{error}</>;
  }

  if (status == "succeeded") {
    return (
      <>
        <ul className="topbar">
          <li>
            {user.username} / {user.email}
          </li>
        </ul>
      </>
    );
  }
}

export default Topbar;
