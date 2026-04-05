import { useEffect, useRef, useState } from 'react'
import { Mic, Phone, PhoneIncoming, PhoneOff, Video } from 'lucide-react'
import type { ChatMessage } from '../../app/App'

type CallState = 'ringing' | 'connecting' | 'listening' | 'speaking' | 'ended'
type CallMode = 'voice' | 'avatar'
type CallDirection = 'incoming' | 'outgoing'
type CallActor = 'juliet' | 'sandra' | 'jules'

interface AvatarScene {
  id: string
  label: string
  imageUrl: string | null
  videoUrl: string | null
}

interface VoiceCallModalProps {
  messages: ChatMessage[]
  mode: CallMode
  direction: CallDirection
  actor: CallActor
  onClose: (status?: 'completed' | 'dismissed') => void
}

export function VoiceCallModal({ messages, mode, direction, actor, onClose }: VoiceCallModalProps) {
  const [state, setState] = useState<CallState>(direction === 'incoming' ? 'ringing' : 'connecting')
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [avatarScene, setAvatarScene] = useState<AvatarScene | null>(null)
  const [avatarReady, setAvatarReady] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const ringtoneCtxRef = useRef<AudioContext | null>(null)
  const ringtoneTimerRef = useRef<number | null>(null)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const cleanupListenerRef = useRef<(() => void) | null>(null)

  // Usar refs para evitar stale closures en los listeners de IPC
  const stateRef = useRef(state)
  const messagesRef = useRef(messages)

  useEffect(() => {
    stateRef.current = state
    messagesRef.current = messages
  }, [state, messages])

  useEffect(() => {
    void loadAvatarScene()
    if (direction === 'outgoing') {
      void startCall()
    }

    // Listener para fragmentos de audio desde el main process
    const cleanupChunks = window.juliet.voice.onLLMChunk((chunk: any) => {
      if (chunk.type === 'audio') {
        audioQueueRef.current.push(chunk.data)
        if (!isPlayingRef.current) {
          void processAudioQueue()
        }
      } else if (chunk.type === 'tool_call') {
        setStatusNote(`Ejecutando: ${chunk.name}...`)
      } else if (chunk.type === 'done') {
        setStatusNote('')
      } else if (chunk.type === 'error') {
        setError(chunk.error)
      }
    })

    // Listener para transcripciones (STT) para activar respuesta LLM
    const cleanupTranscript = (window.juliet as any).voice.onTranscript && (window.juliet as any).voice.onTranscript(async (data: { text: string }) => {
       if (data.text && stateRef.current === 'listening') {
          setTranscript(prev => prev + ' ' + data.text)
          // Activar respuesta LLM si hay una pausa o después de cada frase (proactivo)
          await window.juliet.voice.sendToLLM({
            actor,
            messages: [
              ...messagesRef.current.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: data.text }
            ]
          })
       }
    })

    cleanupListenerRef.current = () => {
      cleanupChunks?.()
      cleanupTranscript?.()
    }

    return () => {
      cleanupListenerRef.current?.()
      stopRingtone()
      stopCall()
    }
  }, [])

  useEffect(() => {
    if (state === 'ringing' || state === 'connecting') {
      void startRingtone()
    } else {
      stopRingtone()
    }
  }, [state])

  async function loadAvatarScene() {
    if (mode !== 'avatar') return
    try {
      const response = await window.juliet.voice.listAvatarScenes()
      const nextScene = response.scenes?.[0] ?? null
      setAvatarScene(nextScene)
    } catch {
      setAvatarScene(null)
    }
  }

  async function startCall() {
    setState('connecting')
    setError('')
    try {
      void playClick()
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })

      audioCtxRef.current = new AudioContext({ sampleRate: 24000 })
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      const micSource = audioCtxRef.current.createMediaStreamSource(mediaStreamRef.current)
      micSource.connect(analyserRef.current)
      startWaveform()

      setState('listening')
      startLocalVoicePipeline()
    } catch (e: any) {
      setError(e.message || 'Error al conectar')
      setState('ended')
    }
  }

  async function startLocalVoicePipeline() {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
    mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current!, { mimeType })

    mediaRecorderRef.current.ondataavailable = async e => {
      if (e.data.size > 0 && state === 'listening') {
        const reader = new FileReader()
        reader.onloadend = () => {
          const res = reader.result as string
          const base64 = res.split(',')[1]
          void (window.juliet as any).voice.sendAudioChunk(base64)
        }
        reader.readAsDataURL(e.data)
      }
    }
    mediaRecorderRef.current.start(2000)

    // Iniciar el turno del LLM proactivamente o esperar a que el usuario hable
    // Simulamos un saludo inicial de Jules si es outgoing
    if (direction === 'outgoing') {
      await window.juliet.voice.sendToLLM({
        actor,
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'system', content: 'Saluda a Clay brevemente para iniciar la llamada.' }
        ]
      })
    }
  }

  async function processAudioQueue() {
    if (audioQueueRef.current.length === 0 || !audioCtxRef.current) {
      isPlayingRef.current = false
      if (state === 'speaking') setState('listening')
      return
    }

    isPlayingRef.current = true
    setState('speaking')
    const base64 = audioQueueRef.current.shift()!
    try {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer)
      const source = audioCtxRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioCtxRef.current.destination)
      source.onended = () => {
        void processAudioQueue()
      }
      source.start()
    } catch {
      void processAudioQueue()
    }
  }

  function stopCall() {
    cancelAnimationFrame(rafRef.current)
    window.juliet.voice.abortLLM()

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    mediaRecorderRef.current = null

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }

  async function playClick() {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(now + 0.1)
    setTimeout(() => void ctx.close(), 200)
  }

  async function startRingtone() {
    stopRingtone()
    const ctx = new AudioContext()
    ringtoneCtxRef.current = ctx

    const pulse = async () => {
      if (!ringtoneCtxRef.current) return
      const now = ringtoneCtxRef.current.currentTime
      const oscillatorA = ringtoneCtxRef.current.createOscillator()
      const oscillatorB = ringtoneCtxRef.current.createOscillator()
      const gain = ringtoneCtxRef.current.createGain()

      oscillatorA.type = 'sine'
      oscillatorB.type = 'sine'
      oscillatorA.frequency.setValueAtTime(425, now)
      oscillatorB.frequency.setValueAtTime(450, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.1)
      gain.gain.linearRampToValueAtTime(0.1, now + 1.9)
      gain.gain.linearRampToValueAtTime(0, now + 2.0)

      oscillatorA.connect(gain)
      oscillatorB.connect(gain)
      gain.connect(ringtoneCtxRef.current.destination)

      oscillatorA.start(now)
      oscillatorB.start(now)
      oscillatorA.stop(now + 2.1)
      oscillatorB.stop(now + 2.1)
    }

    await pulse()
    ringtoneTimerRef.current = window.setInterval(() => {
      void pulse()
    }, 4000)
  }

  function stopRingtone() {
    if (ringtoneTimerRef.current) {
      window.clearInterval(ringtoneTimerRef.current)
      ringtoneTimerRef.current = null
    }
    if (ringtoneCtxRef.current && ringtoneCtxRef.current.state !== 'closed') {
      void ringtoneCtxRef.current.close()
    }
    ringtoneCtxRef.current = null
  }

  function startWaveform() {
    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      const buf = new Float32Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getFloatTimeDomainData(buf)
      ctx.clearRect(0, 0, 300, 100)
      ctx.strokeStyle = '#7dd3fc'
      ctx.lineWidth = 2
      ctx.beginPath()
      const sliceWidth = 300 / buf.length
      let x = 0
      for (let i = 0; i < buf.length; i++) {
        const y = buf[i] * 40 + 50
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.stroke()
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
  }

  const actorLabel = actor === 'jules' ? 'Juliet (Yulex)' : actor === 'sandra' ? 'Sandra' : 'Juliet'
  const canAcceptIncoming = direction === 'incoming' && state === 'ringing'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 backdrop-blur-xl">
      {direction === 'incoming' && state === 'ringing' && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-md animate-in slide-in-from-top-10 duration-500">
          <div className="mx-4 p-6 rounded-[2.5rem] bg-panel-2 border border-accent/50 card-shadow flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <PhoneIncoming size={32} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1">HandOff Detectado</div>
              <div className="text-lg font-bold text-text">Llamada de {actorLabel}</div>
              <div className="text-xs text-muted font-medium mt-1">"Hola Jules" wake-word activada.</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
          {actorLabel} · {mode === 'avatar' ? 'Avatar call' : 'Voice call'}
        </div>
        <div className="mt-2 text-2xl font-semibold text-text">
          {state === 'ringing' ? (direction === 'incoming' ? 'Llamada entrante' : 'Llamando...') :
           state === 'connecting' ? 'Conectando...' :
           state === 'listening' ? 'Escuchando...' :
           state === 'speaking' ? 'Hablando...' : 'Finalizada'}
        </div>
        {statusNote && <div className="mt-2 text-sm text-muted">{statusNote}</div>}
      </div>

      <div className="mb-8 w-full max-w-3xl px-6">
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-panel-2/90 shadow-2xl">
          <div className="aspect-video w-full bg-bg">
            {mode === 'avatar' && avatarScene?.imageUrl && (
              <img
                src={avatarScene.imageUrl}
                alt={avatarScene.label}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  avatarReady && avatarScene.videoUrl ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            {mode === 'avatar' && avatarScene?.videoUrl && (
              <video
                src={avatarScene.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => setAvatarReady(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  avatarReady && state !== 'ringing' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-line bg-bg/70 px-3 py-2 text-sm text-text">
              {direction === 'incoming' ? <PhoneIncoming size={16} /> : mode === 'avatar' ? <Video size={16} /> : <Phone size={16} />}
              {actorLabel}
            </div>
            {mode === 'voice' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
                    boxShadow: `0 0 ${state === 'speaking' ? 60 : 20}px rgba(37,99,235,.4)`,
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  {state === 'listening' ? <Mic size={32} className="text-white" /> : <Phone size={32} className="text-white" />}
                </div>
                <canvas ref={canvasRef} width={300} height={100} className="mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: state === 'listening' ? '#86efac' : state === 'speaking' ? '#93c5fd' : '#fcd34d' }} />
      </div>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <div className="flex items-center gap-3">
        {canAcceptIncoming ? (
          <>
            <button
              onClick={() => {
                void playClick()
                setState('connecting')
                void startCall()
              }}
              className="rounded-full bg-emerald-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Aceptar
            </button>
            <button
              onClick={() => {
                stopCall()
                onClose('dismissed')
              }}
              className="rounded-full bg-red-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-red-600"
            >
              Rechazar
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              stopCall()
              onClose('completed')
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
