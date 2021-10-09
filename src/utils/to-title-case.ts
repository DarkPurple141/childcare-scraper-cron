/**
 * @example
 * 'str' => 'Str'
 * 'str str' => 'Str Str'
 * @param str generic string
 */
export function toTitleCase(str: string) {
  return str.replace(/\+/g, ' ').replace(/(^|\s)\S/g, function (t) {
    return t.toUpperCase()
  })
}
