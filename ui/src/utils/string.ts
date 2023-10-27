/**
 * Returns input string without characters after the "."
 *
 * Examples:
 *  1.
 *    input: hello.pdf
 *    output: hello
 */
function drop_extension(value: string): string {
  return value.substring(0, value.lastIndexOf('.'));
}

export { drop_extension }
