import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

const SEP = '═══════════════════════════════════════'
const DASH = '───────────────────────────────────────'

interface StudentFeedbackData {
  name: string
  feedbacks: {
    content: string
    keywords: string
    createdAt: Date
  }[]
}

interface ExportParams {
  className: string
  studentData: Map<string, StudentFeedbackData>
}

function buildContentLines(className: string, studentData: Map<string, StudentFeedbackData>) {
  const lines: string[] = []

  lines.push(`【${className}班课程反馈汇总】`)
  lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(SEP)

  let totalFeedbackCount = 0
  const studentsWithFeedback: string[] = []

  studentData.forEach((data) => {
    if (data.feedbacks.length === 0) return
    studentsWithFeedback.push(data.name)
    totalFeedbackCount += data.feedbacks.length

    lines.push('')
    lines.push(`📋 学生：${data.name}`)
    lines.push(DASH)

    data.feedbacks.forEach((fb, index) => {
      const dateStr = new Date(fb.createdAt).toLocaleDateString('zh-CN')
      lines.push(`反馈 ${index + 1}（${dateStr}）`)
      lines.push(`关键词：${fb.keywords || '通用'}`)
      lines.push('')
      lines.push(fb.content)
      lines.push('')
      if (index < data.feedbacks.length - 1) {
        lines.push('---')
      }
    })

    lines.push(SEP)
  })

  lines.push('')
  lines.push('📊 统计汇总：')
  lines.push(`总反馈学生数：${studentsWithFeedback.length}人`)
  lines.push(`总反馈条数：${totalFeedbackCount}条`)

  return lines
}

function downloadTxt(lines: string[], fileName: string) {
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, fileName)
}

export async function exportFeedbackDocx(params: ExportParams): Promise<{ success: boolean; usedFallback?: boolean; fileName?: string }> {
  const { className, studentData } = params
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileNameBase = `${className}-课程反馈汇总-${dateStr}`
  const lines = buildContentLines(className, studentData)

  try {
    const children = lines.map((line) => {
      const isTitle = line === lines[0]
      const isSep = line === SEP || line === DASH
      const isStudentHeader = line.startsWith('📋')
      const isStatHeader = line.startsWith('📊')
      const isEmpty = line === ''

      return new Paragraph({
        alignment: isTitle ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: {
          before: isSep || isStudentHeader ? 200 : isEmpty ? 100 : 60,
          after: isEmpty ? 100 : 60,
        },
        children: [
          new TextRun({
            text: line,
            bold: isTitle || isStudentHeader || isStatHeader,
            size: isTitle ? 28 : isStudentHeader || isStatHeader ? 24 : 21,
            font: 'SimSun',
          }),
        ],
      })
    })

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${fileNameBase}.docx`)

    return { success: true, fileName: `${fileNameBase}.docx` }
  } catch {
    downloadTxt(lines, `${fileNameBase}.txt`)
    return { success: true, usedFallback: true, fileName: `${fileNameBase}.txt` }
  }
}
