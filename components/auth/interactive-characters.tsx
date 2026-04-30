'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useCharacterInteraction } from './character-interaction-context'

interface EyePosition {
  x: number
  y: number
}

interface CharacterData {
  id: number
  color: string
  width: number
  height: number
  borderRadius: string
  eyeSpacing: number
  eyeSize: number
  pupilSize: number
  position: { x: number; y: number }
  lookDirection: 'follow' | 'look-away' | 'look-each-other'
}

const CHARACTERS: CharacterData[] = [
  {
    id: 0,
    color: '#7c6ef0',
    width: 70,
    height: 120,
    borderRadius: '12px',
    eyeSpacing: 16,
    eyeSize: 14,
    pupilSize: 5,
    position: { x: 0, y: 0 },
    lookDirection: 'follow',
  },
  {
    id: 1,
    color: '#1a1a2e',
    width: 50,
    height: 90,
    borderRadius: '10px',
    eyeSpacing: 12,
    eyeSize: 11,
    pupilSize: 4,
    position: { x: 0, y: 0 },
    lookDirection: 'follow',
  },
  {
    id: 2,
    color: '#f49c4f',
    width: 90,
    height: 70,
    borderRadius: '45px',
    eyeSpacing: 20,
    eyeSize: 12,
    pupilSize: 4.5,
    position: { x: 0, y: 0 },
    lookDirection: 'follow',
  },
  {
    id: 3,
    color: '#f0d84a',
    width: 55,
    height: 100,
    borderRadius: '28px 28px 8px 8px',
    eyeSpacing: 14,
    eyeSize: 12,
    pupilSize: 4,
    position: { x: 0, y: 0 },
    lookDirection: 'follow',
  },
]

function Character({
  data,
  index,
  mouseX,
  mouseY,
  containerRef,
  lookMode,
}: {
  data: CharacterData
  index: number
  mouseX: number
  mouseY: number
  containerRef: React.RefObject<HTMLDivElement>
  lookMode: 'follow' | 'look-away' | 'look-each-other'
}) {
  const eyeRef = useRef<HTMLDivElement>(null)
  const leftPupilRef = useRef<HTMLDivElement>(null)
  const rightPupilRef = useRef<HTMLDivElement>(null)
  const [smoothEyeX, setSmoothEyeX] = useState(0)
  const [smoothEyeY, setSmoothEyeY] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleNextBlink = useCallback(() => {
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
    const delay = 1500 + Math.random() * 4000
    blinkTimeoutRef.current = setTimeout(() => {
      setIsBlinking(true)
      setTimeout(() => {
        setIsBlinking(false)
        scheduleNextBlink()
      }, 150 + Math.random() * 100)
    }, delay)
  }, [])

  useEffect(() => {
    scheduleNextBlink()
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
    }
  }, [scheduleNextBlink])

  useEffect(() => {
    let rafId: number
    const animate = () => {
      let targetX = 0
      let targetY = 0

      if (lookMode === 'look-each-other') {
        const otherChar = data.id === 0 ? 3 : 0
        const otherData = CHARACTERS[otherChar]
        targetX = (otherData.position.x + otherData.width / 2)
        targetY = (otherData.position.y + otherData.height / 2)
      } else if (lookMode === 'look-away') {
        const angle = (data.id * Math.PI * 2) / 4 + Math.PI / 4
        targetX = Math.cos(angle) * 200
        targetY = -Math.abs(Math.sin(angle) * 100 + 50)
      } else {
        targetX = mouseX
        targetY = mouseY
      }

      if (eyeRef.current) {
        const rect = eyeRef.current.getBoundingClientRect()
        const eyeCenterX = rect.left + rect.width / 2
        const eyeCenterY = rect.top + rect.height / 2

        const dx = targetX - eyeCenterX
        const dy = targetY - eyeCenterY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxMove = data.eyeSize / 2 - data.pupilSize / 2 - 1

        const moveX = distance > 0 ? (dx / distance) * Math.min(distance * 0.02, maxMove) : 0
        const moveY = distance > 0 ? (dy / distance) * Math.min(distance * 0.02, maxMove) : 0

        setSmoothEyeX(prev => prev + (moveX - prev) * 0.15)
        setSmoothEyeY(prev => prev + (moveY - prev) * 0.15)
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [mouseX, mouseY, lookMode, data])

  const pupilStyle: React.CSSProperties = {
    position: 'absolute',
    width: data.pupilSize,
    height: data.pupilSize,
    borderRadius: '50%',
    backgroundColor: '#1a1a2e',
    top: '50%',
    left: '50%',
    transform: `translate(calc(-50% + ${smoothEyeX}px), calc(-50% + ${smoothEyeY}px))`,
    transition: 'transform 0.05s linear',
  }

  const eyeOuterStyle: React.CSSProperties = {
    width: data.eyeSize,
    height: data.eyeSize,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: data.id < 2 ? 20 : 14,
    overflow: 'hidden',
    transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)',
    transition: 'transform 0.1s ease-in-out',
  }

  const characterLayoutStyle: React.CSSProperties = {
    position: 'absolute',
    left: data.position.x,
    bottom: data.position.y,
    width: data.width,
    height: data.height,
    borderRadius: data.borderRadius,
    backgroundColor: data.color,
    animation: `characterBreathe 3s ease-in-out ${index * 0.3}s infinite`,
    zIndex: 10,
  }

  return (
    <div style={characterLayoutStyle}>
      <div ref={eyeRef} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ ...eyeOuterStyle, left: `calc(50% - ${data.eyeSpacing / 2}px)` }}>
          <div ref={leftPupilRef} style={pupilStyle} />
        </div>
        <div style={{ ...eyeOuterStyle, left: `calc(50% + ${data.eyeSpacing / 2}px)` }}>
          <div ref={rightPupilRef} style={{ ...pupilStyle }} />
        </div>
      </div>
    </div>
  )
}

export function InteractiveCharacters({
  lookMode = 'follow',
}: {
  lookMode?: 'follow' | 'look-away' | 'look-each-other'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({})

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX)
      setMouseY(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newPositions: Record<number, { x: number; y: number }> = {}

      const totalWidth = CHARACTERS.reduce((sum, c) => sum + c.width, 0) + (CHARACTERS.length - 1) * 10
      const startX = (rect.width - totalWidth) / 2

      let currentX = startX
      CHARACTERS.forEach((char, i) => {
        newPositions[i] = { x: currentX, y: char.position.y }
        currentX += char.width + 10
      })

      setPositions(newPositions)
    }

    updatePositions()
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [])

  const updatedCharacters = CHARACTERS.map((char, i) => ({
    ...char,
    position: positions[i] || char.position,
    lookDirection: lookMode,
  }))

  return (
    <>
      <style>{`
        @keyframes characterBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {updatedCharacters.map((char, i) => (
          <Character
            key={char.id}
            data={char}
            index={i}
            mouseX={mouseX}
            mouseY={mouseY}
            containerRef={containerRef}
            lookMode={lookMode}
          />
        ))}
      </div>
    </>
  )
}
