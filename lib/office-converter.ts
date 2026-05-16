import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { prisma } from './prisma'
import { ensureStorageDirs } from './storage-config'

const LIBRE_OFFICE_PATHS = [
  'soffice',
  'libreoffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  '/usr/bin/libreoffice',
  '/usr/local/bin/libreoffice',
]

function findLibreOffice(): string | null {
  for (const cmd of LIBRE_OFFICE_PATHS) {
    try {
      if (process.platform === 'win32') {
        if (fs.existsSync(cmd)) return cmd
      }
      return cmd
    } catch {
      continue
    }
  }
  return null
}

export function getLibreOfficePath(): string | null {
  return findLibreOffice()
}

export function isLibreOfficeAvailable(): boolean {
  return getLibreOfficePath() !== null
}

export async function convertToPdf(
  entryId: string,
  inputFilePath: string
): Promise<{ success: boolean; pdfPath?: string; error?: string }> {
  const libreOfficePath = getLibreOfficePath()
  if (!libreOfficePath) {
    await prisma.knowledgeBaseEntry.update({
      where: { id: entryId },
      data: { convertStatus: 'failed' },
    })
    return { success: false, error: 'LibreOffice 未安装或未找到' }
  }

  try {
    await prisma.knowledgeBaseEntry.update({
      where: { id: entryId },
      data: { convertStatus: 'converting' },
    })

    const { pdfPath } = ensureStorageDirs()
    const outputDir = pdfPath

    return new Promise((resolve) => {
      const cmd = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${outputDir}" "${inputFilePath}"`

      exec(cmd, { timeout: 120000 }, async (error, stdout, stderr) => {
        if (error) {
          await prisma.knowledgeBaseEntry.update({
            where: { id: entryId },
            data: { convertStatus: 'failed' },
          })
          resolve({ success: false, error: `转换失败: ${stderr || error.message}` })
          return
        }

        const originalName = path.basename(inputFilePath)
        const pdfFileName = originalName.replace(/\.[^.]+$/, '.pdf')
        const generatedPdfPath = path.join(outputDir, pdfFileName)

        if (fs.existsSync(generatedPdfPath)) {
          const relativePdfPath = path.relative(
            path.join(process.cwd(), 'public'),
            generatedPdfPath
          ).replace(/\\/g, '/')

          await prisma.knowledgeBaseEntry.update({
            where: { id: entryId },
            data: {
              pdfPath: `/${relativePdfPath}`,
              convertStatus: 'done',
            },
          })
          resolve({ success: true, pdfPath: `/${relativePdfPath}` })
        } else {
          await prisma.knowledgeBaseEntry.update({
            where: { id: entryId },
            data: { convertStatus: 'failed' },
          })
          resolve({ success: false, error: '转换后的PDF文件未找到' })
        }
      })
    })
  } catch (error: any) {
    await prisma.knowledgeBaseEntry.update({
      where: { id: entryId },
      data: { convertStatus: 'failed' },
    })
    return { success: false, error: `转换异常: ${error.message}` }
  }
}
