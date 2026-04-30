'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-store'
import TextType from './text type'
import CardSwap, { Card } from './card swap'

const PixelSnow = dynamic(() => import('./pixel snow'), {
  ssr: false,
})

export function ProjectIntroPage() {
  const [isExiting, setIsExiting] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    router.prefetch('/auth/login')
    router.prefetch('/dashboard')
  }, [router])

  const handleEnter = () => {
    setIsExiting(true)
  }

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-clip bg-black"
      animate={isExiting ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.85, ease: 'easeInOut' }}
      style={{ transformOrigin: 'center center' }}
      onAnimationComplete={() => {
        if (isExiting) {
          router.push(isAuthenticated ? '/dashboard' : '/auth/login')
        }
      }}
    >
      <PixelSnow
        color="#FFFFFF"
        flakeSize={0.01}
        minFlakeSize={1.25}
        pixelResolution={200}
        speed={1.25}
        depthFade={8}
        farPlane={20}
        brightness={1}
        gamma={0.4545}
        density={0.3}
        variant="square"
        direction={125}
        className="fixed inset-0 w-full h-full"
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="flex w-full flex-1 items-center justify-center lg:w-2/5 lg:h-screen lg:flex-none lg:justify-start">
          <div className="flex flex-col items-start w-full px-8 lg:pl-16 lg:pr-4">
            <TextType
              as="h1"
              text={["欢迎来到TABuddy！很高兴见到你！", "让我们开启有趣高效的工作之旅吧！"]}
              typingSpeed={80}
              loop={true}
              showCursor={true}
              cursorCharacter="|"
              className="font-sans text-[40px] font-bold leading-snug text-white line-clamp-2"
            />
            <button
              onClick={handleEnter}
              onMouseEnter={() => router.prefetch(isAuthenticated ? '/dashboard' : '/auth/login')}
              className="mt-10 rounded-md border border-white px-10 py-4 text-xl font-bold text-white transition-colors hover:bg-white hover:text-black"
            >
              进入系统
            </button>
          </div>
        </div>

        <div className="hidden w-full lg:flex lg:w-3/5 lg:h-screen items-center justify-center relative">
          <div className="relative w-[640px] h-[480px]">
            <CardSwap
              width={500}
              height={340}
              cardDistance={70}
              verticalDistance={80}
              delay={2500}
              pauseOnHover={true}
              skewAmount={0}
              easing="linear"
            >
              <Card>
                <img src="/img/1.jpg" alt="展示图1" className="h-full w-full object-contain transform-gpu" />
              </Card>
              <Card>
                <img src="/img/2.jpg" alt="展示图2" className="h-full w-full object-contain transform-gpu" />
              </Card>
              <Card>
                <img src="/img/3.jpg" alt="展示图3" className="h-full w-full object-contain transform-gpu" />
              </Card>
              <Card>
                <img src="/img/4.jpg" alt="展示图4" className="h-full w-full object-contain transform-gpu" />
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
