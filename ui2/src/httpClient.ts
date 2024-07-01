import {getBaseURL, getDefaultHeaders} from "@/utils"

import axios from "axios"

const baseUrl = getBaseURL()
const defaultHeaders = getDefaultHeaders()

const client = axios.create({
  baseURL: baseUrl
})

client.defaults.headers.common = defaultHeaders

export default client
