import {Button, Group, Paper, Stack} from "@mantine/core"
import {DateTimePicker} from "@mantine/dates"
import React, {useState} from "react"

type TimestampMode = "range" | "older" | "newer"

interface TimestampRange {
  from?: Date | null
  to?: Date | null
}

interface TimestampPickerProps {
  value?: {
    mode: TimestampMode
    range: TimestampRange
  }
  onChange?: (value: {mode: TimestampMode; range: TimestampRange}) => void
}

const TimestampPicker: React.FC<TimestampPickerProps> = ({value, onChange}) => {
  const [range, setRange] = useState<TimestampRange>(
    value?.range || {from: null, to: null}
  )

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
    onChange?.({mode: "range", range: newRange})
  }

  return (
    <Paper p="xs">
      <Stack>
        <Group justify={"start"}>
          <DateTimePicker
            label="From"
            value={range.from}
            clearable
            withSeconds
          />
          <DateTimePicker label="To" value={range.to} clearable withSeconds />
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
