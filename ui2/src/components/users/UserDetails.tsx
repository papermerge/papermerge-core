import {useSelector} from "react-redux"
import {selectUserDetails} from "@/slices/userDetails"

import type {UserDetails, SliceState} from "@/types"
import type {RootState} from "@/app/types"
import UserForm from "./UserForm"

type Arg = {
  modelId: string
}

export default function UserDetails({modelId}: Arg) {
  const {status, error, data} = useSelector<RootState>(
    selectUserDetails
  ) as SliceState<UserDetails>

  if (status == "loading") {
    return <div>Loading...</div>
  }

  return <UserForm user={data!} />
}
