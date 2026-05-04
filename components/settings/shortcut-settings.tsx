'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useShortcutStore, formatKeysForDisplay, findConflict, getKeysFromEvent, type ShortcutAction, type ShortcutCategory } from '@/lib/shortcut-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Keyboard, RotateCcw, Edit3, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: '页面快速跳转',
  list: '列表/表格操作',
  action: '高频操作',
}

const CATEGORY_ORDER: ShortcutCategory[] = ['navigation', 'list', 'action']

function ShortcutRow({
  shortcut,
  onRecord,
}: {
  shortcut: ShortcutAction
  onRecord: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{shortcut.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{shortcut.description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <kbd className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-muted border border-border rounded-md shadow-sm">
          {formatKeysForDisplay(shortcut.keys)}
        </kbd>
        <button
          type="button"
          onClick={() => onRecord(shortcut.id)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="修改快捷键"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function RecordingOverlay({
  shortcut,
  onSave,
  onCancel,
}: {
  shortcut: ShortcutAction
  onSave: (keys: string[]) => void
  onCancel: () => void
}) {
  const recordingRef = useRef<HTMLDivElement>(null)
  const [pendingKeys, setPendingKeys] = useState<string[] | null>(null)
  const [conflict, setConflict] = useState<{ keys: string[]; label: string } | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') {
      onCancel()
      return
    }

    const keys = getKeysFromEvent(e)
    if (keys.length > 0) {
      setPendingKeys(keys)
      const found = findConflict(keys)
      setConflict(found)
    }
  }, [onCancel])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 3 || e.button === 4) {
      e.preventDefault()
      const keyName = e.button === 3 ? 'XButton1' : 'XButton2'
      const keys = [keyName]
      setPendingKeys(keys)
      const found = findConflict(keys)
      setConflict(found)
    }
  }, [])

  useEffect(() => {
    const el = recordingRef.current
    if (!el) return

    el.focus()
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleMouseDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [handleKeyDown, handleMouseDown])

  const handleConfirm = () => {
    if (!pendingKeys) return
    if (conflict) {
      onSave(pendingKeys)
      toast.success('快捷键已保存（覆盖浏览器冲突）')
    } else {
      onSave(pendingKeys)
      toast.success('快捷键已保存')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        ref={recordingRef}
        tabIndex={-1}
        className="bg-background rounded-xl border border-border shadow-2xl p-8 max-w-md w-full mx-4 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">录制快捷键</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          正在为 <span className="font-medium text-foreground">{shortcut.label}</span> 设置快捷键：
        </p>

        <div className="flex items-center justify-center py-8">
          {pendingKeys ? (
            <kbd className="inline-flex items-center gap-1.5 px-4 py-2 text-base font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg">
              {formatKeysForDisplay(pendingKeys)}
            </kbd>
          ) : (
            <p className="text-base text-muted-foreground animate-pulse">请按下新的快捷键或鼠标按键...</p>
          )}
        </div>

        {conflict && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">检测到浏览器默认快捷键冲突</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {conflict.label} 是浏览器的默认快捷键，强制覆盖可能导致功能冲突。
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            按 Esc 取消
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              取消
            </Button>
            <Button
              size="sm"
              disabled={!pendingKeys}
              onClick={handleConfirm}
              className="gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {conflict ? '强制保存' : '确认'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShortcutSettings() {
  const { shortcuts, updateShortcut, resetToDefaults } = useShortcutStore()
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const recordingShortcut = recordingId ? shortcuts.find(s => s.id === recordingId) : null

  const handleRecord = (id: string) => {
    setRecordingId(id)
  }

  const handleSaveKeys = (keys: string[]) => {
    if (recordingId) {
      updateShortcut(recordingId, keys)
      setRecordingId(null)
    }
  }

  const handleCancelRecord = () => {
    setRecordingId(null)
  }

  const handleReset = () => {
    resetToDefaults()
    toast.success('已恢复所有快捷键为默认设置')
  }

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = shortcuts.filter(s => s.category === cat)
    if (items.length > 0) {
      acc[cat] = items
    }
    return acc
  }, {} as Record<ShortcutCategory, ShortcutAction[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            快捷键设置
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            自定义系统中各类操作的快捷键组合，保存后即时生效
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          恢复默认设置
        </Button>
      </div>

      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null

        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{CATEGORY_LABELS[cat]}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              <div className="divide-y divide-border">
                {items.map(shortcut => (
                  <ShortcutRow
                    key={shortcut.id}
                    shortcut={shortcut}
                    onRecord={handleRecord}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">快捷键使用说明</CardTitle>
          <CardDescription>了解快捷键的使用规则</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• 页面跳转类快捷键全局生效，在任何页面均可使用</p>
          <p>• 列表操作快捷键（方向键、Enter）在输入框内自动失效，不影响正常输入</p>
          <p>• 支持组合键（Ctrl/Alt/Shift + 字母/数字）与单键（F1~F12、方向键等）</p>
          <p>• 支持鼠标侧键（后退键/前进键）绑定</p>
          <p>• 设置后即时生效，无需刷新页面</p>
        </CardContent>
      </Card>

      {recordingShortcut && (
        <RecordingOverlay
          shortcut={recordingShortcut}
          onSave={handleSaveKeys}
          onCancel={handleCancelRecord}
        />
      )}
    </div>
  )
}
