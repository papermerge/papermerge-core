
const DEFAULT_TRUNCATECHARS_COUNT = 32;

/** Truncates a string if it is longer than the specified number
 * of characters. Truncated strings will end with a
 * ellipsis character (”…”). */
function truncatechars(
  value: string,
  count: number = DEFAULT_TRUNCATECHARS_COUNT
): string {

  if (!value) {
    return value;
  }

  if (value.length <= count) {
    return value;
  }

  return `${value.substring(0, count)}...`;
}

export { truncatechars };
