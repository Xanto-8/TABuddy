'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CONFETTI_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#ef4444', // red-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

const SHAPES = ['circle', 'square', 'rect'] as const

interface ConfettiPiece {
  id: number
  x: number
  color: string
  rotation: number
  delay: number
  duration: number
  size: number
  shape: typeof SHAPES[number]
}

interface ConfettiEffectProps {
  active: boolean
  onComplete?: () => void
}

export function ConfettiEffect({ active, onComplete }: ConfettiEffectProps) {
  const [isVisible, setIsVisible] = useState(false)

  const pieces = useMemo<ConfettiPiece[]>(() => {
    if (!active) return []
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      duration: 1.8 + Math.random() * 1.2,
      size: 6 + Math.random() * 8,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }))
  }, [active])

  useEffect(() => {
    if (active) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 2800)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 全屏撒花层 - 不阻挡交互 */}
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute"
                style={{
                  left: `${piece.x}%`,
                  top: '-20px',
                  width: piece.shape === 'rect' ? piece.size * 0.6 : piece.size,
                  height: piece.size,
                }}
                initial={{
                  y: -20,
                  x: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: ['0vh', '100vh'],
                  x: [
                    0,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                  ],
                  rotate: [0, piece.rotation, piece.rotation * 2],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: 'easeIn',
                  times: [0, 0.6, 1],
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: piece.color,
                    borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '1px',
                    opacity: 0.9,
                  }}
                />
              </motion.div>
            ))}

            {/* 文字提示 */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            >
              <div className="bg-background/90 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-2xl border border-border">
                <div className="text-center">
                  <motion.span
                    className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: 1, ease: 'easeInOut' }}
                  >
                    当前课程任务已完成！
                  </motion.span>
                  <motion.div
                    className="mt-2 text-3xl"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    🎉
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
