import {useState, useEffect, useRef} from "react"
import {State} from "@/types"
import {getDefaultHeaders, getBaseURL} from "@/utils"
import {imageEncode} from "@/utils"

function fetch_jpeg(
  url: string | null,
  headers: any,
  setBase: any,
  setResult: any
) {
  if (!url) {
    return new Promise((_, reject) => {
      reject({
        is_loading: false,
        data: null,
        error: "Page url is null. Maybe page previews not yet ready?"
      })
    })
  }

  return fetch(url, {headers: headers}).then(res => {
    if (res.status == 401) {
      throw Error(`${res.status} ${res.statusText}`)
    }

    if (res.status === 200) {
      res.arrayBuffer().then(data => {
        setBase(imageEncode(data, "image/jpeg"))
        setResult({
          is_loading: false,
          error: null,
          data: imageEncode(data, "image/jpeg")
        })
      })
    }
  })
}

export const useProtectedSVG = (
  url: string | null,
  fallback_url: string | null
) => {
  /*
    In case fetching url returns 404, then fallback_url will be tried.
    `url` - is the URL of the SVG image.
    `fallback_url` - is the URL of the jpeg image, Jpeg image will
    always exists as it will be generated on the fly in case it is not there
    yet
    */
  //The initial value is empty
  const initial_state: State<JSX.Element | null> = {
    is_loading: true,
    error: null,
    data: null
  }
  const [svg, setSVG] = useState("")
  const [result, setResult] = useState(initial_state)
  const [_, setBase64] = useState("data:image/jpeg;base64,")
  const headers = getDefaultHeaders()
  const ref = useRef<HTMLInputElement>(null)
  const result_svg_component = <div ref={ref}></div>

  if (!url) {
    return new Promise((_, reject) => {
      reject({
        is_loading: false,
        data: null,
        error: "Page url is null. Maybe page previews not yet ready?"
      })
    })
  }

  if (!url.startsWith("/api/")) {
    return new Promise((resolve, _) => {
      resolve({
        is_loading: false,
        data: url!,
        error: null
      })
    })
  }

  // url starts with /api/ -> images are served by own backend
  // TODO: add global variable to distinguish who serves protected images

  url = `${getBaseURL(true)}${url}`

  useEffect(() => {
    fetch(url, {headers: headers}).then(res => {
      if (res.status === 200) {
        res.text().then(data => {
          setSVG(data)
          setResult({
            is_loading: false,
            error: null,
            data: result_svg_component
          })
        })
      } else if (res.status == 404 || res.status == 403) {
        if (!fallback_url) {
          setResult({
            is_loading: false,
            error: null,
            data: result_svg_component
          })
          return
        }
        // fallback to jpeg image
        fetch_jpeg(fallback_url, headers, setBase64, setResult)
      }
    })
  }, [url])

  useEffect(() => {
    if (ref?.current) {
      ref.current.innerHTML = svg
    }
  }, [svg])

  return result
}

export const useProtectedJpg = (url: string | null) => {
  //The initial value is empty
  const initial_state: State<string | null> = {
    is_loading: true,
    error: null,
    data: null
  }
  const [_, setBase64] = useState("data:image/jpeg;base64,")
  const [result, setResult] = useState(initial_state)
  const headers = getDefaultHeaders()
  const noPreview = {
    is_loading: false,
    data: null,
    error: "Page url is null. Maybe page previews not yet ready?"
  }
  const cloudURL = {
    is_loading: false,
    data: url!,
    error: null
  }

  useEffect(() => {
    if (!url) {
      setResult(noPreview)
    } else if (url && !url.startsWith("/api/")) {
      setResult(cloudURL)
    } else if (url) {
      // url starts with /api/ -> images are served by own backend
      // TODO: add global variable to distinguish who serves protected images
      url = `${getBaseURL(true)}${url}`
      fetch_jpeg(url, headers, setBase64, setResult).catch((error: Error) => {
        setResult({
          is_loading: false,
          data: null,
          error: error.toString()
        })
      })
    }
  }, [url])

  return result
}
