import {useAppSelector} from "@/app/hooks"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import formatNumber from "@/utils/formatNumber"
import {Text} from "@mantine/core"

interface Args {
  value: string
}

/**
 * Format Monetary Value
 *
 * Monetary values has always precision of 2
 */
export function MonetaryFMT({value}: Args) {
  const {number_format} = useAppSelector(selectMyPreferences)
  const fmt_value = formatNumber(value, number_format, 2) // precision=2

  return <Text size="sm">{fmt_value}</Text>
}

/**
 * Format Numerical Value
 */
export function NumberFMT({value}: Args) {
  const {number_format} = useAppSelector(selectMyPreferences)
  const fmt_value = formatNumber(value, number_format)

  return <Text size="sm">{fmt_value}</Text>
}
