import {useGetSharedNodeAccessDetailsQuery} from "@/features/shared_nodes/apiSlice"
import {Skeleton} from "@mantine/core"
import type {IDType} from "./type"

interface Args {
  node_id: string
  onClickViewButton: (sel_id: string, idType: IDType) => void
  onClickDeleteButton: (sel_id: string, idType: IDType) => void
}

export default function ManageAccessGroups({node_id}: Args) {
  const {data, isLoading} = useGetSharedNodeAccessDetailsQuery(node_id)

  if (isLoading && !data) {
    return <Skeleton height={50} />
  }

  return <></>
}
