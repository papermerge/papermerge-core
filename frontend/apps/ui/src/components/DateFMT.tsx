import {useAppSelector} from "@/app/hooks"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {formatDate} from "@/utils/formatTime"
import {Text} from "@mantine/core"

interface Args {
  value: string
}

/**
 * Format Date
 */
export default function DateFMT({value}: Args) {
  const {date_format} = useAppSelector(selectMyPreferences)
  const fmt_value = formatDate(value, date_format)

  return <Text size="sm">{fmt_value}</Text>
}
