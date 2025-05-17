import useDocumentThumbnail from "@/hooks/DocumentThumbnail"
import {Loader} from "@mantine/core"
import ThumbnailPlaceholder from "./ThumbnailPlaceholder"

interface Args {
  nodeID: string
}

export default function Thumbnail({nodeID}: Args) {
  const {data, isLoading, isError, error} = useDocumentThumbnail({nodeID})

  if (isLoading) {
    return <Loader />
  }

  if (isError) {
    return <ThumbnailPlaceholder error={error} />
  }

  if (data) {
    return <img src={data} />
  }

  return <ThumbnailPlaceholder error={"No data"} />
}
