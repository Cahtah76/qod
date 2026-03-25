// Returns the user's local timezone abbreviation, e.g. "MT", "PT", "CT", "ET"
export function tzAbbr() {
  return new Date()
    .toLocaleTimeString('en-US', { timeZoneName: 'short' })
    .split(' ')
    .at(-1)
}
