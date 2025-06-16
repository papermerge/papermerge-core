import {Page} from "@papermerge/viewer"
import usePage from "./usePage"

interface Args {
  pageNumber: number
  angle: number
  zoomFactor: number
  pageID: string
}

export default function PageContainer({
  pageNumber,
  angle,
  pageID,
  zoomFactor
}: Args) {
  const {ref, isLoading, imageURL} = usePage({pageNumber, pageID})

  return (
    <Page
      ref={ref}
      angle={angle}
      zoomFactor={zoomFactor}
      isLoading={isLoading}
      pageNumber={pageNumber}
      imageURL={imageURL}
    />
  )
}
