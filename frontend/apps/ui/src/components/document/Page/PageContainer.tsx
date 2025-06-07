import {Page} from "@papermerge/viewer"
import usePage from "./usePage"

interface Args {
  pageNumber: number
  pageID: string
}

export default function PageContainer({pageNumber, pageID}: Args) {
  const {ref, isLoading, imageURL} = usePage({pageNumber, pageID})

  return (
    <Page
      ref={ref}
      isLoading={isLoading}
      pageNumber={pageNumber}
      imageURL={imageURL}
    />
  )
}
