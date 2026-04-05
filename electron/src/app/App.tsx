import { useState, useEffect, useRef } from 'react'
import type { Conversation } from '../types'
import { ChatArea } from './layout/ChatArea'
import { WorkspaceChrome } from './layout/WorkspaceChrome'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { MemoryPanel } from '../components/memory/MemoryPanel'
import { VoiceCallModal } from '../components/voice/VoiceCallModal'
import { ProactorDashboard } from '../components/ProactorDashboard'

export type AppView = 'chat' | 'settings' | 'memory' | 'dashboard'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  knowledgeCard?: {
    id?: string
    title: string
    route: string
    answerShort: string
    answerDetailed: string
    steps: string[]
    prerequisites: string[]
    warnings: string[]
    sourceLabel: string
    sourcePath: string
    sourceUrl: string
    speakableText: string
    confidence: number
    latencyMs: number
  } | null
}

type VoiceCallMode = 'voice' | 'avatar'
type VoiceCallDirection = 'incoming' | 'outgoing'

interface ActiveCall {
  mode: VoiceCallMode
  direction: VoiceCallDirection
  actor: 'juliet' | 'sandra' | 'jules'
  callbackId?: string
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openrouter')
  const [selectedModel, setSelectedModel] = useState('openrouter/auto')
  const [apiKeys, setApiKeys] = useState<Record<string, boolean>>({})
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const newConvRef = useRef<string | null>(null)

  // Init: load conversations and schema
  useEffect(() => {
    async function init() {
      await window.juliet.memory.initSchema()
      const keys = await window.juliet.settings.getAllKeys()
      setApiKeys(keys)
      const convos = await window.juliet.memory.getConversations()
      setConversations(convos)
    }
    init()
  }, [])

  useEffect(() => {
    const applyTheme = async () => {
      const savedTheme = await window.juliet.settings.get('ui_theme')
      if (savedTheme && savedTheme !== 'auto') {
        document.documentElement.dataset.theme = savedTheme
        return
      }
      const hour = new Date().getHours()
      const theme = hour >= 8 && hour < 20 ? 'day' : 'night'
      document.documentElement.dataset.theme = theme
    }

    void applyTheme()
    const intervalId = window.setInterval(() => { void applyTheme() }, 60000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let cancelled = false

    const pollCallbacks = async () => {
      if (cancelled || activeCall) return
      try {
        const nextCallback = await window.juliet.voice.dequeueReadyCallback()
        if (!cancelled && nextCallback) {
          setActiveCall({
            mode: nextCallback.mode === 'avatar' ? 'avatar' : 'voice',
            direction: 'incoming',
            actor: nextCallback.actor === 'juliet' ? 'juliet' : 'sandra',
            callbackId: nextCallback.id,
          })
        }
      } catch {}
    }

    // Wake-word / HandOff detection simulation
    const pollWakeWord = async () => {
      if (cancelled || activeCall) return
      try {
        // En una implementación real, esto vendría de un proceso de fondo que escucha el micro
        // Aquí simulamos que si hay una tarea 'wake-jules' en la memoria compartida, disparamos la llamada.
        const vision = await window.juliet.memory.getSharedVision('wake-jules')
        if (vision && vision.content === 'active') {
          setActiveCall({
            mode: 'voice',
            direction: 'incoming',
            actor: 'jules',
          })
          // Limpiar el trigger
          await window.juliet.memory.saveSharedVision('wake-jules', 'idle')
        }
      } catch {}
    }

    void pollCallbacks()
    void pollWakeWord()
    const intervalId = window.setInterval(() => {
      void pollCallbacks()
      void pollWakeWord()
    }, 4000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [activeCall])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }
    async function load() {
      if (newConvRef.current === activeConversationId) {
        newConvRef.current = null
        return
      }
      const dbMsgs = await window.juliet.memory.getMessages(activeConversationId!)
      setMessages(dbMsgs.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content_json,
        createdAt: new Date(m.created_at).getTime(),
      })))
    }
    load()
  }, [activeConversationId])

  async function createNewConversation(): Promise<string> {
    const id = crypto.randomUUID()
    await window.juliet.memory.createConversation({
      id,
      title: 'Nueva conversación',
      provider: selectedProvider,
      model: selectedModel,
    })
    const convos = await window.juliet.memory.getConversations()
    setConversations(convos)
    newConvRef.current = id
    setActiveConversationId(id)
    setMessages([])
    setView('chat')
    return id
  }

  async function deleteConversation(id: string) {
    await window.juliet.memory.deleteConversation(id)
    const convos = await window.juliet.memory.getConversations()
    setConversations(convos)
    if (activeConversationId === id) {
      setActiveConversationId(null)
      setMessages([])
    }
  }

  async function closeActiveCall(status: 'completed' | 'dismissed' = 'completed') {
    const callbackId = activeCall?.callbackId
    setActiveCall(null)
    if (!callbackId) return
    try {
      await window.juliet.voice.updateCallbackStatus(callbackId, status)
    } catch {}
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-bg">
      <WorkspaceChrome
        view={view}
        onViewChange={setView}
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={(id) => { if (id !== activeConversationId) setActiveConversationId(id) }}
        onCreateConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        apiKeys={apiKeys}
        onOpenVoice={(mode = 'voice') =>
          setActiveCall({
            mode,
            direction: 'outgoing',
            actor: 'jules',
          })
        }
      >
        <main className="flex-1 flex flex-col overflow-hidden">
          {view === 'dashboard' && (
            <ProactorDashboard />
          )}
          {view === 'chat' && (
            <ChatArea
              messages={messages}
              setMessages={setMessages}
              conversationId={activeConversationId}
              onCreateConversation={createNewConversation}
              isStreaming={isStreaming}
              setIsStreaming={setIsStreaming}
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              apiKeys={apiKeys}
            />
          )}
          {view === 'settings' && (
            <SettingsPanel apiKeys={apiKeys} setApiKeys={setApiKeys} />
          )}
          {view === 'memory' && (
            <MemoryPanel />
          )}
        </main>
      </WorkspaceChrome>
      {activeCall && (
        <VoiceCallModal
          messages={messages}
          mode={activeCall.mode}
          direction={activeCall.direction}
          actor={activeCall.actor}
          onClose={status => void closeActiveCall(status)}
        />
      )}
    </div>
  )
}
