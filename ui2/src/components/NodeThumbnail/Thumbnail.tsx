import {useAppSelector} from "@/app/hooks"
import {selectThumbnailByNodeId} from "@/features/nodes/selectors"
import {Loader} from "@mantine/core"
import ThumbnailPlaceholder from "./ThumbnailPlaceholder"

interface Args {
  nodeID: string
}

export default function Thumbnail({nodeID}: Args) {
  const url = useAppSelector(s => selectThumbnailByNodeId(s, nodeID))

  if (!url) {
    return <Loader />
  }

  if (url) {
    return <img src={url} />
  }

  return <ThumbnailPlaceholder error={"No data"} />
}
