type asmmacro = {
  params: string[]
  body: string
  line: [number, number]
}
type datainfo = {
  body: string
  type: string
  line: number
  value: string | number
}