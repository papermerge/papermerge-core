import { useRef, useEffect } from 'react';
import type { PageType } from "@/types"
import { useProtectedSVG, useProtectedJpg } from "../../hooks/protected_image"

type Args = {
  page: PageType
}

export function Page({page}: Args) {

  const base64_jpg = useProtectedJpg(page.jpg_url);
  const svg_image = useProtectedSVG(page.svg_url);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref?.current) {
      ref.current.innerHTML = svg_image;
    }
  }, [svg_image]);

  return <div className='d-flex flex-column p-2 m-2 page pb-0'>
    <div ref={ref} className='svg-image'>
    </div>
    <div className='p-2 mb-3 page-number text-center'>
      {page.number}
    </div>
  </div>
}
