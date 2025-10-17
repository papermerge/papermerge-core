import {createSlice} from "@reduxjs/toolkit"

export type AuditLogSlice = {}

export const initialState: AuditLogSlice = {}

const auditLogSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {}
})

export default auditLogSlice.reducer
