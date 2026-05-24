'use client'

import React from 'react'

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0
  let inList = false
  const listItems: React.ReactNode[] = []

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(<ul key={key++} className="list-disc pl-5 space-y-1 my-2">{listItems.slice()}</ul>)
      listItems.length = 0
    }
    inList = false
  }

  const processInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let p = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index))
        }
        parts.push(<strong key={p++}>{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }
    return parts
  }

  while (i < lines.length) {
    const line = lines[i]
    i++

    if (line.startsWith('## ')) {
      flushList()
      const title = line.slice(3).trim()
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border">
          {processInline(title)}
        </h2>
      )
      continue
    }

    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={key++} className="text-base font-semibold text-foreground mt-4 mb-2">
          {processInline(line.slice(4).trim())}
        </h3>
      )
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2).trim()
      listItems.push(<li key={key++} className="text-sm text-muted-foreground leading-relaxed">{processInline(content)}</li>)
      inList = true
      continue
    }

    if (/^\d+[.、]\s/.test(line)) {
      flushList()
      const content = line.replace(/^\d+[.、]\s/, '')
      listItems.push(<li key={key++} className="text-sm text-muted-foreground leading-relaxed">{processInline(content)}</li>)
      inList = true
      continue
    }

    flushList()

    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
      continue
    }

    elements.push(
      <p key={key++} className="text-sm text-muted-foreground leading-relaxed">
        {processInline(line.trim())}
      </p>
    )
  }

  flushList()

  return <div className="markdown-body">{elements}</div>
}
