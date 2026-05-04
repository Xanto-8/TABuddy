import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

interface ExportParams {
  className: string
  studentRecords: Map<string, { name: string; records: any[] }>
}

function calcAcc(score: number | undefined, total: number | undefined): number | null {
  if (score != null && total != null && total > 0) {
    return Math.round((score / total) * 1000) / 10
  }
  return null
}

function buildContentLines(className: string, studentRecords: Map<string, { name: string; records: any[] }>) {
  const lines: string[] = []
  const sep = '----------------'

  lines.push(`【${className}班小测记录】`)
  lines.push(sep)

  let totalTestCount = 0
  const wordAccList: number[] = []
  const grammarAccList: number[] = []

  studentRecords.forEach((data) => {
    lines.push(`学生：${data.name}`)

    for (const r of data.records) {
      totalTestCount++

      const ws = r.wordScore
      const wt = r.wordTotal
      const gs = r.grammarScore
      const gt = r.grammarTotal
      const ga = r.grammarAccuracy

      const wa = calcAcc(ws, wt)
      if (wa != null) wordAccList.push(wa)

      let gAcc = calcAcc(gs, gt)
      if (gAcc != null) {
        grammarAccList.push(gAcc)
      } else if (ga != null) {
        gAcc = ga
        grammarAccList.push(ga)
      }

      const wordStr = ws != null && wt != null
        ? `- 单词：${ws}/${wt}${wa != null ? `（正确率${wa}%）` : ''}`
        : '- 单词：-'
      lines.push(wordStr)

      if (gs != null && gt != null) {
        lines.push(`- 语法：${gs}/${gt}${gAcc != null ? `（正确率${gAcc}%）` : ''}`)
      } else if (ga != null) {
        lines.push(`- 语法：正确率${ga}%`)
      } else {
        lines.push('- 语法：-')
      }
    }

    lines.push(sep)
  })

  const avgWord = wordAccList.length > 0
    ? Math.round((wordAccList.reduce((a, b) => a + b, 0) / wordAccList.length) * 10) / 10
    : 0
  const avgGrammar = grammarAccList.length > 0
    ? Math.round((grammarAccList.reduce((a, b) => a + b, 0) / grammarAccList.length) * 10) / 10
    : 0

  lines.push('班级统计：')
  lines.push(`小测总次数：${totalTestCount}次`)
  lines.push(`单词平均正确率：${avgWord}%`)
  lines.push(`语法平均正确率：${avgGrammar}%`)

  return lines
}

function downloadTxt(lines: string[], fileName: string) {
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, fileName)
}

export async function exportQuizDocx(params: ExportParams): Promise<{ success: boolean; usedFallback?: boolean; fileName?: string }> {
  const { className, studentRecords } = params
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileNameBase = `${className}-小测记录-${dateStr}`
  const lines = buildContentLines(className, studentRecords)

  try {
    const children = lines.map((line) => {
      const isTitle = line === lines[0]
      const isSep = line === '----------------'

      return new Paragraph({
        alignment: isTitle ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: isSep ? { before: 60, after: 60 } : { before: 40, after: 40 },
        children: [
          new TextRun({
            text: line,
            bold: isTitle,
            size: isTitle ? 32 : 22,
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
