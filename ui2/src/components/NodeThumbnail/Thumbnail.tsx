import {useAppSelector} from "@/app/hooks"
import {selectThumbnailByNodeId} from "@/features/nodes/selectors"
import {Loader} from "@mantine/core"
import ThumbnailPlaceholder from "./ThumbnailPlaceholder"

interface Args {
  nodeID: string
}

export default function Thumbnail({nodeID}: Args) {
  const objectURLState = useAppSelector(s => selectThumbnailByNodeId(s, nodeID))

  if (!objectURLState) {
    return <Loader />
  }

  if (objectURLState.url && !objectURLState.error) {
    return <img src={objectURLState.url} />
  }

  return <ThumbnailPlaceholder error={"Thumbnail failed to load"} />
}
