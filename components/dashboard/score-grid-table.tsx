'use client'

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface GridColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
}

export interface GridRow {
  id: string
  name: string
  data: Record<string, string>
}

interface ScoreGridTableProps {
  columns: GridColumn[]
  rows: GridRow[]
  onCellChange: (rowId: string, columnKey: string, value: string) => void
  onSave: () => Promise<void>
  onBatchMark?: (key: string, value: string) => void
  batchLabel?: string
}

export default function ScoreGridTable({ columns, rows, onCellChange, onSave, onBatchMark, batchLabel }: ScoreGridTableProps) {
  const [saving, setSaving] = useState(false)
  const [focusRow, setFocusRow] = useState(0)
  const [focusCol, setFocusCol] = useState(0)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    const totalRows = rows.length
    const totalCols = columns.length + 1

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        setFocusCol(Math.min(colIdx + 1, totalCols - 1))
        break
      case 'ArrowLeft':
        e.preventDefault()
        setFocusCol(Math.max(colIdx - 1, 0))
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusRow(Math.min(rowIdx + 1, totalRows - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusRow(Math.max(rowIdx - 1, 0))
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          if (colIdx > 0) setFocusCol(colIdx - 1)
          else if (rowIdx > 0) { setFocusRow(rowIdx - 1); setFocusCol(totalCols - 1) }
        } else {
          if (colIdx < totalCols - 1) setFocusCol(colIdx + 1)
          else if (rowIdx < totalRows - 1) { setFocusRow(rowIdx + 1); setFocusCol(0) }
        }
        break
      case 'Enter':
        e.preventDefault()
        if (rowIdx < totalRows - 1) setFocusRow(rowIdx + 1)
        break
    }
  }, [rows.length, columns.length])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave()
      toast.success('已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-4 py-3 text-left font-medium text-foreground min-w-[100px]">学生</th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-3 text-center font-medium text-foreground min-w-[80px]">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="sticky left-0 bg-card px-4 py-2 font-medium text-foreground">{row.name}</td>
                {columns.map((col, colIdx) => (
                  <td key={col.key} className="px-1 py-1">
                    {col.type === 'select' && col.options ? (
                      <select
                        value={row.data[col.key] || ''}
                        onChange={(e) => onCellChange(row.id, col.key, e.target.value)}
                        autoFocus={rowIdx === focusRow && colIdx + 1 === focusCol}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">-</option>
                        {col.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={row.data[col.key] || ''}
                        onChange={(e) => onCellChange(row.id, col.key, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx + 1)}
                        autoFocus={rowIdx === focusRow && colIdx + 1 === focusCol}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="-"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '批量保存'}
        </button>
        {onBatchMark && batchLabel && (
          <button
            onClick={() => onBatchMark('status', 'completed')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            {batchLabel}
          </button>
        )}
      </div>
    </div>
  )
}
