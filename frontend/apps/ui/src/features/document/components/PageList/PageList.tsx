import { Page } from "viewer"
import page_a_md from "../assets/pages/page_a/md.jpg"

type PageStruct = {
  id: string
  number: number
}

interface Args {
  pages: Array<PageStruct>
}

export default function Pages({pages}: Args) {
  const pagesComponent = pages.map(p => (
    <Page
      key={p.id}
      pageNumber={p.number}
      isLoading={false}
      imageURL={page_a_md}
    />
  ))
  return <>{pagesComponent}</>
}
