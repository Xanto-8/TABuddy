const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(
  path.join(__dirname, '..', 'lib', 'auto-fill', 'bookmarklet-source.js'),
  'utf8'
)

let code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

const strings = []
const placeholders = []
let counter = 0

code = code.replace(/'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"/g, (match) => {
  const id = '__STR' + (counter++) + '__'
  strings.push(match)
  placeholders.push(id)
  return id
})

code = code.replace(/\n\s*/g, ' ')
code = code.replace(/\s{2,}/g, ' ')
code = code.replace(/\s*([{}();,:+\-*/<>=!&|])\s*/g, '$1')
code = code.replace(/;\}/g, '}')
code = code.replace(/,(\s*[}\]])/g, '$1')
code = code.trim()

for (let i = 0; i < strings.length; i++) {
  code = code.replace(placeholders[i], strings[i])
}

// Escape backticks and dollar signs for template literal
const escaped = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

console.log('const BOOKMARKLET_CODE = `' + escaped + '`')
