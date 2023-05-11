import type { PageType } from "@/types"

type Args = {
  page: PageType
}

export function Page({page}: Args) {
  return <>
    <div>
      {page.svg_url}
    </div>
    <div>
      {page.jpg_url}
    </div>
    <div>
      Page num = {page.number}
    </div>
  </>
}
