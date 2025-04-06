import {useGetSharedNodeAccessDetailsQuery} from "@/features/shared_nodes/apiSlice"
import {Skeleton} from "@mantine/core"

interface Args {
  node_id: string
}

export default function ManageAccessUsers({node_id}: Args) {
  const {data, isLoading} = useGetSharedNodeAccessDetailsQuery(node_id)

  if (isLoading !data) {
    return <Skeleton height={50} />
  }

  return <></>
}
