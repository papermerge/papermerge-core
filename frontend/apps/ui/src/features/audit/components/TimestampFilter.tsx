import type {TimestampFilterType} from "@/features/audit/types"
import {Button, Group, Paper, Stack} from "@mantine/core"
import {DateTimePicker} from "@mantine/dates"
import {TFunction} from "i18next"

interface Args {
  range?: TimestampFilterType
  onChange?: (range: TimestampFilterType) => void
  t?: TFunction
}

export default function TimestampFilter({range, onChange, t}: Args) {
  const onChangeFrom = (valueFrom: string | null) => {
    if (onChange) {
      onChange({
        from: valueFrom,
        to: range?.to || null
      })
    }
  }

  const onChangeTo = (valueTo: string | null) => {
    if (onChange) {
      onChange({
        to: valueTo,
        from: range?.from || null
      })
    }
  }

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
        if (onChange) {
          onChange(newRange)
        }
        break
      case "1hour":
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        newRange = {from: oneHourAgo.toISOString(), to: now.toISOString()}
        if (onChange) {
          onChange(newRange)
        }
        break
      case "3hours":
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
        newRange = {from: threeHoursAgo.toISOString(), to: now.toISOString()}
        if (onChange) {
          onChange(newRange)
        }
        break
    }
  }

  const handleClear = () => {
    const newRange: TimestampFilterType = {from: null, to: null}
    if (onChange) {
      onChange(newRange)
    }
  }

  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <Stack>
        <Group justify={"start"}>
          <DateTimePicker
            label={t?.("auditLog.timestampFilter.from") || "From"}
            value={range?.from}
            miw={180}
            clearable
            withSeconds
            onChange={onChangeFrom}
          />
          <DateTimePicker
            label={t?.("auditLog.timestampFilter.to") || "To"}
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
            {t?.("auditLog.timestampFilter.today") || "Today"}
          </Button>
          <Button
            size="xs"
            variant="light"
            onClick={() => handleQuickSelect("1hour")}
          >
            {t?.("auditLog.timestampFilter.last_1_hour") || "Last 1 Hour"}
          </Button>
          <Button
            size="xs"
            variant="light"
            onClick={() => handleQuickSelect("3hours")}
          >
            {t?.("auditLog.timestampFilter.last_3_hour") || "Last 3 Hours"}
          </Button>
          <Button size="xs" variant="light" onClick={() => handleClear()}>
            {t?.("auditLog.timestampFilter.clear") || "Clear"}
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}
