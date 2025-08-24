import {Button, Group, Paper, Stack} from "@mantine/core"
import {DateTimePicker} from "@mantine/dates"
import type {AuditLogQueryParams} from "../types"

import React, {useEffect, useState} from "react"

interface TimestampRange {
  from?: Date | null
  to?: Date | null
}

interface TimestampPickerProps {
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

const TimestampPicker: React.FC<TimestampPickerProps> = ({setQueryParams}) => {
  const [range, setRange] = useState<TimestampRange>()

  const onChangeFrom = (value: string | null) => {
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: value ? value : undefined
    }))

    setRange(prev => ({
      ...prev,
      from: value ? new Date(value) : null
    }))
  }

  const onChangeTo = (value: string | null) => {
    setQueryParams(prev => ({
      ...prev,
      filter_timestamp_from: value ? value : undefined
    }))
    setRange(prev => ({
      ...prev,
      to: value ? new Date(value) : null
    }))
  }

  useEffect(() => {
    if (range?.from) {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_from: range?.from?.toISOString()
      }))
    }

    if (range?.to) {
      setQueryParams(prev => ({
        ...prev,
        filter_timestamp_to: range?.to?.toISOString()
      }))
    }
  }, [range])

  const handleQuickSelect = (type: "today" | "1hour" | "3hours") => {
    const now = new Date()
    let newRange: TimestampRange = {from: null, to: null}

    switch (type) {
      case "today":
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        newRange = {from: startOfDay, to: endOfDay}
        break
      case "1hour":
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        newRange = {from: oneHourAgo, to: now}
        break
      case "3hours":
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
        newRange = {from: threeHoursAgo, to: now}
        break
    }

    setRange(newRange)
  }

  return (
    <Paper p="xs">
      <Stack>
        <Group justify={"start"}>
          <DateTimePicker
            label="From"
            value={range?.from}
            clearable
            withSeconds
            onChange={onChangeFrom}
          />
          <DateTimePicker
            label="To"
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
        </Group>
      </Stack>
    </Paper>
  )
}

export default TimestampPicker
