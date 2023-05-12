import type { PageType } from "@/types"
import { useProtectedSrc } from "../../hooks/protected_src"

type Args = {
  page: PageType
}

export function Page({page}: Args) {

  // const base64_jpg = useProtectedSrc(page.jpg_url, 'image/jpeg');
  const base64_svg = useProtectedSrc(page.svg_url, 'image/svg+xml');

  return <>
    <div>
    <img src={base64_svg} />
    </div>
    <div>
      Page num = {page.number}
    </div>
  </>
}
