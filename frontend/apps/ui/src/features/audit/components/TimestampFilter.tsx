import type {
  AuditLogQueryParams,
  FilterHookReturn,
  TimestampFilterType
} from "@/features/audit/types"
import {Button, Group, Paper, Stack} from "@mantine/core"
import {DateTimePicker} from "@mantine/dates"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  auditLogTimestampFilterValueUpdated,
  selectAuditLogTimestampFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import React, {useCallback, useEffect, useMemo} from "react"

interface TimestampFilterArgs {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

export function useTimestampFilter({
  setQueryParams
}: TimestampFilterArgs): FilterHookReturn {
  const mode = usePanelMode()
  const range = useAppSelector(s => selectAuditLogTimestampFilterValue(s, mode))

  const clear = useCallback(() => {
    // Single batch update instead of two separate calls
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: undefined,
      filter_timestamp_to: undefined
    }))
  }, [setQueryParams])

  useEffect(() => {
    // Single batch update instead of separate calls
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: range?.from || undefined,
      filter_timestamp_to: range?.to || undefined
    }))
  }, [range, setQueryParams])

  return {clear}
}

// Memoize the main component
const TimestampFilter = React.memo<TimestampFilterArgs>(({setQueryParams}) => {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const range = useAppSelector(s => selectAuditLogTimestampFilterValue(s, mode))

  // Memoize handlers to prevent unnecessary re-renders
  const onChangeFrom = useCallback(
    (value: string | null) => {
      const newFrom = value ? new Date(value) : null

      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_from: value || undefined
      }))

      dispatch(
        auditLogTimestampFilterValueUpdated({
          mode,
          value: {
            from: newFrom?.toISOString() || null,
            to: range?.to || null
          }
        })
      )
    },
    [setQueryParams, dispatch, mode, range?.to]
  )

  const onChangeTo = useCallback(
    (value: string | null) => {
      const newTo = value ? new Date(value) : null

      // BUG FIX: This was setting filter_timestamp_from instead of filter_timestamp_to
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_to: value || undefined // Fixed: was filter_timestamp_from
      }))

      dispatch(
        auditLogTimestampFilterValueUpdated({
          mode,
          value: {
            from: range?.from || null,
            to: newTo?.toISOString() || null
          }
        })
      )
    },
    [setQueryParams, dispatch, mode, range?.from]
  )

  // Remove duplicate useEffect - already handled in hook

  // Memoize date calculations to prevent recalculation on every render
  const quickSelectRanges = useMemo(() => {
    const now = new Date()

    return {
      today: () => {
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        return {from: startOfDay.toISOString(), to: endOfDay.toISOString()}
      },
      oneHour: () => {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        return {from: oneHourAgo.toISOString(), to: now.toISOString()}
      },
      threeHours: () => {
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
        return {from: threeHoursAgo.toISOString(), to: now.toISOString()}
      }
    }
  }, []) // Empty dependency - recalculate only when component mounts

  const handleQuickSelect = useCallback(
    (type: "today" | "1hour" | "3hours") => {
      let newRange: TimestampFilterType

      switch (type) {
        case "today":
          newRange = quickSelectRanges.today()
          break
        case "1hour":
          newRange = quickSelectRanges.oneHour()
          break
        case "3hours":
          newRange = quickSelectRanges.threeHours()
          break
      }

      dispatch(
        auditLogTimestampFilterValueUpdated({
          mode,
          value: newRange
        })
      )
    },
    [dispatch, mode, quickSelectRanges]
  )

  const handleClear = useCallback(() => {
    const newRange: TimestampFilterType = {from: null, to: null}
    dispatch(
      auditLogTimestampFilterValueUpdated({
        mode,
        value: newRange
      })
    )
  }, [dispatch, mode])

  // Memoize static props
  const paperProps = useMemo(() => ({p: "xs" as const}), [])
  const groupProps = useMemo(() => ({justify: "start" as const}), [])

  return (
    <Paper {...paperProps}>
      <Stack>
        <Group {...groupProps}>
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
          <Button size="xs" variant="light" onClick={handleClear}>
            Clear
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
})

TimestampFilter.displayName = "TimestampFilter"

export default TimestampFilter
