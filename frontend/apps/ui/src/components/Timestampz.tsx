import {useAppSelector} from "@/app/hooks"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {formatTimestamp} from "@/utils/formatTime"
import {Text} from "@mantine/core"

interface Args {
  value: string
}

/**
 * Timezone aware timestamp
 */
export default function TimestampZ({value}: Args) {
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)
  const fmt_tz_value = formatTimestamp(value, timestamp_format, timezone)

  return <Text size="sm">{fmt_tz_value}</Text>
}
