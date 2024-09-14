import type {DocumentVersion} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"

import axios from "axios"

const baseUrl = getBaseURL()
const defaultHeaders = getDefaultHeaders()

const client = axios.create({
  baseURL: baseUrl
})

client.defaults.headers.common = defaultHeaders

export default client

function get_file_ext(file_name: string): string {
  var arr = file_name.split(".")
  return arr.pop()!
}

function get_file_basename(file_name: string): string {
  var arr = file_name.split(".")
  arr.pop()
  return arr.join(".")
}

/*
download_file of specific document version

First gets the current `download_url`, as in case of S3 storage
(S3 private storage actually) there expiration keys are
valid for couple of minutes only
*/
async function download_file(doc_ver: DocumentVersion) {
  const resp1 = await client.get(`/api/document-versions/${doc_ver.id}`)
  const v = resp1.data as DocumentVersion
  // now, with `download_url` at hand, actual download starts!
  v.download_url
  const resp2 = await client.get(v.download_url, {responseType: "blob"})
  const blob = resp2.data
  const url = window.URL.createObjectURL(blob)
  /*
  Based on:
    - stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
    - https://stackoverflow.com/a/78401145
  */
  let a = document.createElement("a")
  const ext = get_file_ext(v.file_name)
  const basename = get_file_basename(v.file_name)

  a.href = url
  if (v.short_description) {
    a.download = `${basename}-v${v.number}-${v.short_description}.${ext}`
  } else {
    a.download = `${basename}-v${v.number}.${ext}`
  }
  // we need to append the element to the dom -> otherwise it will not work in firefox
  document.body.appendChild(a)
  a.click()
  //afterwards we remove the element again
  a.remove()
}

export {download_file}
