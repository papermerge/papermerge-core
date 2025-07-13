import {SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES} from "./constants"

function isSupportedFile(file: File): boolean {
  const typeOk = SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase())

  const extension = file.name.split(".").pop()?.toLowerCase() || ""
  const extOk = SUPPORTED_EXTENSIONS.includes(`.${extension}`)

  // Accept if either type or extension match (extension is fallback)
  return typeOk || extOk
}

export {isSupportedFile}
