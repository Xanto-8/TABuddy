export interface AutoFillStudentData {
  name: string
  feedback: string
}

export interface AutoFillData {
  className: string
  date: string
  students: AutoFillStudentData[]
}

export function packAutoFillData(
  className: string,
  students: AutoFillStudentData[]
): string {
  const data: AutoFillData = {
    className,
    date: new Date().toISOString().split('T')[0],
    students,
  }
  return JSON.stringify(data, null, 2)
}

export function generateBookmarkletUrl(jsSource: string): string {
  const minified = jsSource
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim()
  return 'javascript:' + encodeURIComponent(minified)
}
