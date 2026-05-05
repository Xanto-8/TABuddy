const fs = require('fs')
const path = require('path')
const pngToIco = require('png-to-ico').default

async function copyIcon() {
  const projectRoot = path.join(__dirname, '..', '..')
  const assetsDir = path.join(__dirname, '..', 'assets')

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true })
  }

  const srcPng = path.join(projectRoot, 'img', 'app图标.png')
  const dstPng = path.join(assetsDir, 'icon.png')
  const dstIco = path.join(assetsDir, 'icon.ico')

  if (!fs.existsSync(srcPng)) {
    console.error(`Source icon not found: ${srcPng}`)
    console.error(`Please place your app icon at: ${srcPng}`)
    process.exit(1)
  }

  fs.copyFileSync(srcPng, dstPng)
  console.log(`Copied icon: ${srcPng} -> ${dstPng}`)

  try {
    const icoBuffer = await pngToIco(dstPng)
    fs.writeFileSync(dstIco, icoBuffer)
    console.log(`Created ICO: ${dstIco} (${icoBuffer.length} bytes)`)
    console.log('Done! Icons are ready for Electron.')
  } catch (err) {
    console.error('Failed to create ICO:', err.message)
    process.exit(1)
  }
}

copyIcon()
