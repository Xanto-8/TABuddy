'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, CheckCircle, X, RefreshCw, AlertTriangle, Smartphone } from 'lucide-react'

function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

function isHTTPS(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:'
}

function getDeviceType(): 'ios' | 'android' | 'other' {
  if (typeof window === 'undefined') return 'other'
  const ua = window.navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'other'
}

export default function MobileUploadPage() {
  const [session, setSession] = useState<string>('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])
  const [error, setError] = useState('')
  const [networkError, setNetworkError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const heartBeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const weChat = isWeChatBrowser()
  const https = isHTTPS()
  const deviceType = getDeviceType()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session')
    if (sessionId) {
      setSession(sessionId)
    } else {
      setError('无效的链接：缺少会话标识')
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!session || !loaded) return

    const checkSession = async () => {
      try {
        const res = await fetch(`/api/qr-store?session=${session}&since=0`)
        if (!res.ok) {
          setSessionExpired(true)
          setError('二维码已过期，请返回电脑端刷新二维码')
          return
        }
        const data = await res.json()
        if (data.expired) {
          setSessionExpired(true)
          setError('二维码已过期，请返回电脑端刷新二维码')
        }
      } catch {
        setNetworkError(true)
      }
    }

    checkSession()
    heartBeatRef.current = setInterval(checkSession, 10000)

    return () => {
      if (heartBeatRef.current) {
        clearInterval(heartBeatRef.current)
      }
    }
  }, [session, loaded])

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [photos])

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }, [])

  const handleGallerySelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
    if (galleryInputRef.current) {
      galleryInputRef.current.value = ''
    }
  }, [])

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const uploadPhotos = useCallback(async () => {
    if (photos.length === 0 || !session) return
    setUploading(true)
    setError('')
    setNetworkError(false)

    const uploadedPaths: string[] = []

    for (const photo of photos) {
      try {
        const formData = new FormData()
        formData.append('file', photo.file)

        const uploadRes = await fetch('/api/upload-imgur', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          throw new Error(`上传失败: ${photo.file.name}`)
        }

        const uploadData = await uploadRes.json()

        const storeRes = await fetch('/api/qr-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session,
            filePath: uploadData.filePath,
            fileName: uploadData.fileName,
          }),
        })

        if (storeRes.status === 410) {
          setSessionExpired(true)
          throw new Error('二维码已过期，请返回电脑端刷新后重试')
        }

        if (!storeRes.ok) {
          throw new Error('同步到电脑端失败')
        }

        uploadedPaths.push(uploadData.filePath)
      } catch (err) {
        setError(err instanceof Error ? err.message : '上传出错，请重试')
        setUploading(false)
        return
      }
    }

    setUploaded(uploadedPaths)
    setUploading(false)
    setPhotos([])
  }, [photos, session])

  const retake = () => {
    setUploaded([])
    setPhotos([])
    setError('')
    setNetworkError(false)
    setSessionExpired(false)
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-white/60 text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-white/5 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-white text-lg font-medium mb-2">无效的链接</h2>
          <p className="text-white/50 text-sm mb-2">请重新扫描电脑端二维码获取有效链接</p>
          <p className="text-white/30 text-xs">如果问题依旧，请点击二维码下方的「刷新二维码」重新生成</p>
        </div>
      </div>
    )
  }

  if (!https) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-white/5 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-white text-lg font-medium mb-3">需要 HTTPS 连接</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            相机功能需要通过 HTTPS 安全连接访问。
          </p>
          <p className="text-white/40 text-sm mt-3">
            请在浏览器地址栏确认连接为 HTTPS，或尝试使用其它浏览器打开。
          </p>
        </div>
      </div>
    )
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="text-white text-lg font-medium mb-2">二维码已过期</h2>
          <p className="text-white/50 text-sm mb-6">
            该二维码已超过5分钟有效期，请返回电脑端点击「刷新二维码」重新生成。
          </p>
          <div className="inline-flex items-center gap-2 text-white/40 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            在电脑端点击「刷新二维码」后重新扫码
          </div>
        </div>
      </div>
    )
  }

  if (weChat) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-white/5 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-white/50" />
          </div>
          <h2 className="text-white text-lg font-medium mb-3">请在浏览器中打开</h2>
          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
            <p className="text-white/70 text-sm leading-relaxed">
              点击右上角 <span className="text-white font-medium">【···】</span>，
              选择 <span className="text-white font-medium">【在浏览器中打开】</span>，即可拍照上传。
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-left">
            <p className="text-white/50 text-xs leading-relaxed">
              💡 备用方案：长按二维码保存到手机相册，然后用系统自带的浏览器扫描二维码打开。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10">
        <Camera className="h-5 w-5 text-blue-400 flex-shrink-0" />
        <span className="text-sm font-medium">拍照上传小测</span>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 pb-4">
        {uploaded.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-5">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">上传成功!</h2>
            <p className="text-white/60 mb-2">
              已成功上传 {uploaded.length} 张照片
            </p>
            <p className="text-white/40 text-sm mb-10">
              请返回电脑端查看和编辑
            </p>
            <button
              onClick={retake}
              className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              继续拍照
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center">
              {photos.length === 0 ? (
                <div className="text-center w-full max-w-sm">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-white/40" />
                  </div>
                  <h2 className="text-lg font-medium mb-2">拍照上传练习照片</h2>
                  <p className="text-white/40 text-sm mb-8 leading-relaxed">
                    拍摄学生的练习照片，照片将自动同步到电脑端
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center justify-center w-full px-6 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors text-base font-medium"
                    >
                      <Camera className="h-5 w-5 mr-2.5" />
                      拍照
                    </button>

                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-sm font-medium"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      从相册选择
                    </button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGallerySelect}
                  />
                </div>
              ) : (
                <div className="w-full max-w-sm">
                  <h3 className="text-sm font-medium text-white/60 mb-3">
                    已选择 {photos.length} 张照片
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5">
                        <img
                          src={photo.preview}
                          alt={`照片 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 active:bg-black/90 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {photos.length > 0 && (
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl border border-white/20 text-sm hover:bg-white/5 active:bg-white/10 transition-colors"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        继续拍照
                      </button>
                    )}

                    <button
                      onClick={uploadPhotos}
                      disabled={uploading}
                      className="inline-flex items-center justify-center w-full px-4 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      {uploading ? (
                        <span className="inline-flex items-center">
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          上传中...
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          上传 {photos.length} 张照片
                        </span>
                      )}
                    </button>
                  </div>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGallerySelect}
                  />
                </div>
              )}
            </div>

            {networkError && !error && (
              <div className="mb-3 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-400 font-medium">无法连接到电脑</p>
                    <p className="text-xs text-yellow-400/60 mt-0.5">
                      请检查网络连接，或返回电脑端刷新二维码后重试
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">上传失败</p>
                    <p className="text-xs text-red-400/60 mt-0.5">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
