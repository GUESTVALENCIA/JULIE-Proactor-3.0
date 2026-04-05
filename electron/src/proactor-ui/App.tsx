import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles.css';
import StatusBadge from './components/StatusBadge';
import RecordButton from './components/RecordButton';
import CallButton from './components/CallButton';
import ChatInput from './components/ChatInput';
import InsightsPanel from './components/InsightsPanel';
import BookingPanel from './components/BookingPanel';
import { JulietBrainPanel } from './components/JulietBrainPanel';
import { TranscriptionPanel } from './components/TranscriptionPanel';

export type AppState = 'inactive' | 'listening' | 'processing' | 'in-call';

interface Insight {
  type: string;
  text: string;
  timestamp: string;
}

interface ProactorTask {
  id: string;
  text: string;
  priority?: string;
  done?: boolean;
}

interface ProposedAction {
  id: string;
  type: 'execute' | 'send_to_juliet' | 'open_link' | 'send_message';
  label: string;
  description: string;
  target?: string;
  payload?: string;
  timestamp: number;
}

export default function App() {
  const [state, setState] = useState<AppState>('inactive');
  const [transcript, setTranscript] = useState('');
  const [isInterim, setIsInterim] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [reflection, setReflection] = useState('');
  const [tasks, setTasks] = useState<ProactorTask[]>([]);
  const [transcriptLog, setTranscriptLog] = useState<{ text: string; time: string; isFinal: boolean }[]>([]);
  const [planSummary, setPlanSummary] = useState('');
  const [memorySummary, setMemorySummary] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  const [transcriptFilter, setTranscriptFilter] = useState<'all' | 'mic' | 'keyboard' | 'sofia'>('all');
  const [panelMode, setPanelMode] = useState<'panels' | 'classic'>('panels');
  const [thinking, setThinking] = useState(false);
  const [keyboardCaptureActive, setKeyboardCaptureActive] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const contentBottomRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // TTS via window.juliet.voice.tts
  const playTtsAudio = useCallback(async (text: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      const base64 = await window.juliet?.voice?.tts?.(text, 'juliet');
      if (!base64) return;
      const blob = new Blob(
        [Uint8Array.from(atob(base64), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.warn('[Proactor TTS] Error:', err);
    }
  }, []);

  const cancelTtsPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  // Keyboard capture listener
  useEffect(() => {
    const unsub = window.juliet?.keyboard?.onText?.((data) => {
      const time = new Date(data.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTranscriptLog(prev => [...prev, { text: `[⌨️ ${data.app}] ${data.text}`, time, isFinal: true }].slice(-50));
    });
    return () => { unsub?.(); };
  }, []);

  // Window maximize state
  useEffect(() => {
    window.juliet?.window?.isMaximized?.().then(setIsMaximized);
    const unsub = window.juliet?.window?.onMaximizedChanged?.((isMax) => setIsMaximized(isMax));
    return () => { unsub?.(); };
  }, []);

  // Check Deepgram key on mount
  useEffect(() => {
    (async () => {
      try {
        const dgKey = await window.juliet?.voice?.getDeepgramKey?.();
        if (!dgKey) {
          setMicError('DEEPGRAM_API_KEY no configurada. Añádela en Settings.');
        }
        // Check gateway/runtime
        const rt = await window.juliet?.voice?.getRuntimeState?.();
        setGatewayStatus(rt?.gatewayOnline ? 'ok' : 'error');
      } catch {
        setGatewayStatus('error');
      }
    })();

    // Load pending tasks
    (async () => {
      try {
        const pending = await window.juliet?.memory?.tasks?.getPending?.();
        if (Array.isArray(pending) && pending.length > 0) {
          setTasks(pending.map((t: any) => ({
            id: t.id || String(Math.random()),
            text: t.description || '',
            priority: t.priority || 'medium',
            done: t.status === 'done',
          })));
        }
      } catch { /* no tasks */ }
    })();

    // Load cached reflection
    (async () => {
      try {
        const ref = await window.juliet?.memory?.getSharedVision?.('juliet-reflection');
        if (ref?.content) setReflection(ref.content);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    contentBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLog, reflection, tasks]);

  const handleMicToggle = useCallback(async () => {
    if (state === 'listening') {
      setState('inactive');
      setTranscript('');
      setMicError(null);
    } else if (state === 'inactive') {
      setMicError(null);
      setState('listening');
    }
  }, [state]);

  const handleKeyboardCaptureToggle = useCallback(async () => {
    if (keyboardCaptureActive) {
      await window.juliet?.keyboard?.stopCapture?.();
      setKeyboardCaptureActive(false);
    } else {
      const success = await window.juliet?.keyboard?.startCapture?.();
      setKeyboardCaptureActive(success || false);
    }
  }, [keyboardCaptureActive]);

  const handleCallToggle = useCallback(async () => {
    if (state === 'in-call') {
      setState('listening');
    } else {
      setState('in-call');
    }
  }, [state]);

  const handleChatSend = useCallback(async (text: string) => {
    setState('processing');
    setTranscript(text);
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscriptLog(prev => [...prev, { text, time, isFinal: true }].slice(-50));

    try {
      let responseText = '';
      const unsub = window.juliet?.chat?.onChunk?.((chunk) => {
        if (chunk.type === 'text' && chunk.text) {
          responseText += chunk.text;
          setTranscript(responseText);
        }
        if (chunk.type === 'done') {
          setReflection(responseText);
          setPlanSummary(responseText.slice(0, 200) + (responseText.length > 200 ? '…' : ''));
          playTtsAudio(responseText);
          // Cache reflection
          window.juliet?.memory?.saveSharedVision?.('juliet-reflection', responseText).catch(() => {});
        }
      });

      await window.juliet?.chat?.send?.({
        provider: 'g4f-unlimited',
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Eres Juliet (Yulex), asistente proactiva Senior Google Engineer. Responde en español, de forma concisa y profesional.' },
          { role: 'user', content: text },
        ],
        maxTokens: 500,
        temperature: 0.7,
      });

      unsub?.();
    } catch (e) {
      console.error('[Proactor] Chat send error:', e);
    }
    setState('inactive');
  }, [playTtsAudio]);

  const handleMinimize = () => {
    window.juliet?.window?.minimize?.();
  };

  const handleMaximize = () => {
    window.juliet?.window?.maximize?.();
  };

  const handleClose = () => {
    window.juliet?.window?.close?.();
  };

  const handleExecuteAction = useCallback(async (action: ProposedAction) => {
    try {
      switch (action.type) {
        case 'execute':
          if (action.target) await window.juliet?.mcp?.callTool?.(action.target, JSON.parse(action.payload || '{}'));
          break;
        case 'send_to_juliet':
          if (action.payload) await handleChatSend(action.payload);
          break;
        case 'open_link':
          if (action.target) await window.juliet?.desktop?.openExternal?.(action.target);
          break;
        case 'send_message':
          if (action.payload) await handleChatSend(action.payload);
          break;
      }
      setProposedActions(prev => prev.filter(a => a.id !== action.id));
    } catch (e) {
      console.error('[Proactor] Error executing action:', e);
    }
  }, [handleChatSend]);

  return (
    <div className="proactor-root">
      {/* Top Bar — Draggable */}
      <div className="top-bar">
        <div className="top-bar-left">
          <StatusBadge state={state} />
          <span className="top-bar-title">PROACTOR</span>
        </div>
        <div className="top-bar-controls">
          {insights.length > 0 && (
            <button
              className="icon-btn"
              style={{ width: 18, height: 18, fontSize: 10, background: 'rgba(96, 165, 250, 0.3)', color: '#60a5fa' }}
              onClick={() => setShowInsights(!showInsights)}
              title="Insights"
            >
              !
            </button>
          )}
          <button className="top-bar-btn btn-minimize" onClick={handleMinimize} title="Minimizar" />
          <button className="top-bar-btn btn-maximize" onClick={handleMaximize} title={isMaximized ? 'Restaurar' : 'Maximizar'} />
          <button className="top-bar-btn btn-close" onClick={handleClose} title="Cerrar" />
        </div>
      </div>

      {/* Content */}
      <div className="content-area">
        {/* Status Bar compacta */}
        <div className="status-bar-compact">
          <div className="status-indicators">
            <span className={`indicator ${gatewayStatus === 'ok' ? 'ok' : 'error'}`} title="Gateway">🌐</span>
            <span className={`indicator ${state === 'listening' ? 'ok' : 'off'}`} title="Mic">🎤</span>
            <span className={`indicator ${keyboardCaptureActive ? 'ok' : 'off'}`} title="Teclado">⌨️</span>
          </div>
          <button
            className="mode-toggle"
            onClick={() => setPanelMode(panelMode === 'panels' ? 'classic' : 'panels')}
            title={panelMode === 'panels' ? 'Vista clásica' : 'Vista paneles'}
          >
            {panelMode === 'panels' ? '📊' : '📜'}
          </button>
        </div>

        {micError && <div className="status-line error-line">{micError}</div>}

        {/* Modo Paneles */}
        {panelMode === 'panels' ? (
          <div className="panels-container">
            <BookingPanel />

            <JulietBrainPanel
              reflection={reflection}
              tasks={tasks}
              proposedActions={proposedActions}
              thinking={thinking}
              openClawConnected={gatewayStatus === 'ok'}
              onActionClick={handleExecuteAction}
              onTaskToggle={(taskId) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t))}
            />

            <TranscriptionPanel
              entries={transcriptLog}
              currentTranscript={transcript}
              isInterim={isInterim}
              filter={transcriptFilter}
              onFilterChange={setTranscriptFilter}
              maxHeight={100}
            />

            <InsightsPanel
              insights={insights}
              visible={true}
              onClose={() => {}}
              mode="fixed"
              maxHeight={100}
            />
          </div>
        ) : (
          /* Modo Clásico */
          <>
            <div className="status-line">
              {state === 'listening' ? 'Escuchando PROACTOR' : state === 'in-call' ? 'En llamada con JULIET...' : 'Mic inactivo'}
            </div>

            {(transcript || transcriptLog.length > 0) && (
              <div className="transcript-stream">
                <div className="stream-header">
                  <span className="stream-label">Transcripción en tiempo real</span>
                </div>
                {transcriptLog.map((e, i) => (
                  <div key={i} className="stream-item mic-source">
                    <span className="stream-time">{e.time}</span> {e.text}
                  </div>
                ))}
                {transcript && (
                  <div className={`transcript-text ${isInterim ? 'interim' : ''}`}>{transcript}</div>
                )}
                <div ref={contentBottomRef} />
              </div>
            )}

            <div className="reflection-block block-plans">
              <div className="reflection-label">Planes</div>
              <div className="reflection-text">{planSummary || reflection || '—'}</div>
            </div>

            <div className="reflection-block block-memory">
              <div className="reflection-label">Memoria (contexto reciente)</div>
              <div className="reflection-text small">{memorySummary || '—'}</div>
            </div>

            {reflection && (
              <div className="reflection-block">
                <div className="reflection-label">Juliet Proactor</div>
                <div className="reflection-text">{reflection}</div>
              </div>
            )}

            {tasks.length > 0 && (
              <div className="tasks-block">
                <div className="tasks-label">Tareas</div>
                <ul className="tasks-list">
                  {tasks.slice(0, 8).map((t, i) => (
                    <li key={t.id || i} className="tasks-item">
                      <span className={`tasks-prio tasks-prio-${t.priority || 'medium'}`}>{t.priority || '·'}</span> {t.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <InsightsPanel insights={insights} visible={showInsights} onClose={() => setShowInsights(false)} />
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <ChatInput onSend={handleChatSend} disabled={state === 'in-call'} />
        <RecordButton active={state === 'listening'} onClick={handleMicToggle} disabled={state === 'in-call'} />
        <button
          className={`icon-btn keyboard-btn ${keyboardCaptureActive ? 'active' : ''}`}
          onClick={handleKeyboardCaptureToggle}
          title={keyboardCaptureActive ? 'Detener captura de teclado' : 'Capturar teclado global'}
          disabled={state === 'in-call'}
          style={{
            background: keyboardCaptureActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.3)',
            color: keyboardCaptureActive ? '#22c55e' : '#94a3b8',
            fontSize: 14,
            width: 36,
            height: 36,
            borderRadius: 8,
          }}
        >
          ⌨️
        </button>
        <CallButton active={state === 'in-call'} onClick={handleCallToggle} />
      </div>
    </div>
  );
}
