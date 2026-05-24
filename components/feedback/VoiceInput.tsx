'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceInputProps {
  onResult: (text: string) => void
  placeholder?: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: {
    [index: number]: {
      [index: number]: { transcript: string; confidence: number }
      isFinal: boolean
      length: number
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function VoiceInput({ onResult, placeholder }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setSupported(false)
      setError('当前浏览器不支持语音识别，请使用 Chrome 浏览器')
      return
    }
    try {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'zh-CN'

      recognition.onstart = () => setListening(true)
      recognition.onend = () => setListening(false)

      recognition.onerror = (event) => {
        setListening(false)
        if (event.error === 'not-allowed') {
          setError('请授权麦克风权限后重试')
        } else if (event.error === 'no-speech') {
          setError('未检测到语音，请再试一次')
        } else {
          setError(event.error || '语音识别出错')
        }
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += text
          } else {
            interimTranscript += text
          }
        }
        const all = (finalTranscript || interimTranscript).trim()
        setTranscript(all)
        if (finalTranscript) {
          onResult(finalTranscript.trim())
        }
      }

      recognitionRef.current = recognition
    } catch {
      setSupported(false)
      setError('语音识别初始化失败')
    }
  }, [onResult])

  const toggle = useCallback(() => {
    setError('')
    const recognition = recognitionRef.current
    if (!recognition) return
    if (listening) {
      setListening(false)
      recognition.abort()
    } else {
      setTranscript('')
      try {
        recognition.start()
      } catch {
        recognition.abort()
        setTimeout(() => { try { recognition.start() } catch {} }, 100)
      }
    }
  }, [listening])

  const handleClear = useCallback(() => {
    setTranscript('')
    setError('')
    setListening(false)
    const recognition = recognitionRef.current
    if (recognition) recognition.abort()
  }, [])

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        title={listening ? '点击停止录音' : '点击开始语音输入（Chrome浏览器）'}
        className={`
          relative inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all shrink-0
          ${!supported
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : listening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
              : 'bg-background border border-border text-muted-foreground hover:border-purple-400 hover:text-purple-600'
          }
        `}
      >
        {listening ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {(transcript || error) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            className="absolute left-0 top-full mt-2 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[260px]"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {error ? (
                  <p className="text-xs text-red-500">{error}</p>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript || '正在聆听...'}
                    {listening && (
                      <span className="inline-flex ml-2 gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={handleClear}
                className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {listening && (
        <span className="text-xs text-purple-600 font-medium animate-pulse whitespace-nowrap">
          录音中...
        </span>
      )}
    </div>
  )
}
