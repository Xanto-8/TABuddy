'use client'

import React from 'react'
import { Sparkles, Settings, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BatchActionBarProps {
  onBatchGenerate: () => void
  onAutoFillConfig: () => void
  isBatchMode?: boolean
}

export default function BatchActionBar({ onBatchGenerate, onAutoFillConfig, isBatchMode }: BatchActionBarProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.button
        onClick={onBatchGenerate}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm font-medium ${
          isBatchMode
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles className="h-4 w-4" />
        批量生成
      </motion.button>

      <motion.button
        onClick={onAutoFillConfig}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent/50 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Settings className="h-4 w-4" />
        书签帮助
      </motion.button>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Star className="h-4 w-4 text-purple-500" />
        <span className="text-xs text-muted-foreground">
          支持批量生成和书签快捷复制，提升工作效率
        </span>
      </div>
    </div>
  )
}
