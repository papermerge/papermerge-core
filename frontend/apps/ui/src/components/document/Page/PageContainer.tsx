import Page from "./Page"
import usePage from "./usePage"

interface Args {
  page_number: number
  page_id: string
}

export default function PageContainer({page_number, page_id}: Args) {
  const {ref, isLoading, imageURL} = usePage({
    pageNumber: page_number,
    pageID: page_id
  })

  return (
    <Page
      ref={ref}
      isLoading={isLoading}
      pageNumber={page_number}
      imageURL={imageURL}
    />
  )
}
