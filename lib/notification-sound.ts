let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 523.25
    osc1.connect(gain)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 659.25
    osc2.connect(gain)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08)
    gain.gain.linearRampToValueAtTime(0, now + 0.1)

    osc1.start(now)
    osc1.stop(now + 0.1)

    gain.gain.setValueAtTime(0, now + 0.14)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.15)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.18)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.22)
    gain.gain.linearRampToValueAtTime(0, now + 0.28)

    osc2.start(now + 0.14)
    osc2.stop(now + 0.28)
  } catch {
  }
}

export function playNotificationSoundLegacy() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 659.25
    osc.connect(gain)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.015)
    gain.gain.linearRampToValueAtTime(0, now + 0.25)

    osc.start(now)
    osc.stop(now + 0.25)
  } catch {
  }
}
