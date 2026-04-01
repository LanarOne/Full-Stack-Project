export const toYMD = (day = new Date()) => day.toISOString().slice(0, 10)

export const parseYMD = (toParse: string) => {
  const [year, month, day] = toParse.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date format: ${toParse}`)
  }
  return new Date(Date.UTC(year, month - 1, day))
}
export const shiftYMD = (toShift: string, offset: number): string => {
  const date = parseYMD(toShift)
  date.setUTCDate(date.getUTCDate() + offset)
  return toYMD(date)
}
