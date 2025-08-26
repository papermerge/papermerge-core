import {Button, Group, Paper, Stack} from "@mantine/core"
import {DateTimePicker} from "@mantine/dates"
import type {AuditLogQueryParams, TimestampFilterType} from "../types"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogTimestampFilterValueUpdated,
  selectAuditLogTimestampFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import React, {useEffect} from "react"

interface TimestampFilterArgs {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

interface TimestampFilterReturn {
  clear: () => void
}

export function useTimestampFilter({
  setQueryParams
}: TimestampFilterArgs): TimestampFilterReturn {
  const mode = usePanelMode()
  const range = useAppSelector(s => selectAuditLogTimestampFilterValue(s, mode))

  const clear = () => {
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: undefined
    }))

    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_to: undefined
    }))
  }

  useEffect(() => {
    if (range?.from) {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_from: range?.from || undefined
      }))
    } else {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_from: undefined
      }))
    }

    if (range?.to) {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_to: range?.to || undefined
      }))
    } else {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_to: undefined
      }))
    }
  }, [range])

  return {clear}
}

const TimestampFilter: React.FC<TimestampFilterArgs> = ({setQueryParams}) => {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const range = useAppSelector(s => selectAuditLogTimestampFilterValue(s, mode))

  const onChangeFrom = (value: string | null) => {
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: value ? value : undefined
    }))

    const newFrom = value ? new Date(value) : null

    dispatch(
      auditLogTimestampFilterValueUpdated({
        mode,
        value: {
          from: newFrom?.toDateString() || null,
          to: range?.to || null
        }
      })
    )
  }

  const onChangeTo = (value: string | null) => {
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: value ? value : undefined
    }))
    const newTo = value ? new Date(value) : null

    dispatch(
      auditLogTimestampFilterValueUpdated({
        mode,
        value: {
          to: newTo?.toISOString() || null,
          from: range?.from || null
        }
      })
    )
  }

  useEffect(() => {
    if (range?.from) {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_from: range?.from || undefined
      }))
    } else {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_from: undefined
      }))
    }

    if (range?.to) {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_to: range?.to || undefined
      }))
    } else {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_to: undefined
      }))
    }
  }, [range])

  const handleQuickSelect = (type: "today" | "1hour" | "3hours") => {
    const now = new Date()
    let newRange: TimestampFilterType = {from: null, to: null}

    switch (type) {
      case "today":
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        newRange = {from: startOfDay.toISOString(), to: endOfDay.toISOString()}
        break
      case "1hour":
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        newRange = {from: oneHourAgo.toISOString(), to: now.toISOString()}
        break
      case "3hours":
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
        newRange = {from: threeHoursAgo.toISOString(), to: now.toISOString()}
        break
    }
    dispatch(
      auditLogTimestampFilterValueUpdated({
        mode,
        value: newRange
      })
    )
  }

  const handleClear = () => {
    const newRange: TimestampFilterType = {from: null, to: null}
    dispatch(
      auditLogTimestampFilterValueUpdated({
        mode,
        value: newRange
      })
    )
  }

  return (
    <Paper p="xs">
      <Stack>
        <Group justify={"start"}>
          <DateTimePicker
            label="From"
            value={range?.from}
            miw={180}
            clearable
            withSeconds
            onChange={onChangeFrom}
          />
          <DateTimePicker
            label="To"
            miw={180}
            value={range?.to}
            clearable
            withSeconds
            onChange={onChangeTo}
          />
        </Group>

        <Group>
          <Button
            size="xs"
            variant="light"
            onClick={() => handleQuickSelect("today")}
          >
            Today
          </Button>
          <Button
            size="xs"
            variant="light"
            onClick={() => handleQuickSelect("1hour")}
          >
            Last 1 Hour
          </Button>
          <Button
            size="xs"
            variant="light"
            onClick={() => handleQuickSelect("3hours")}
          >
            Last 3 Hours
          </Button>
          <Button size="xs" variant="light" onClick={() => handleClear()}>
            Clear
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

export default TimestampFilter
