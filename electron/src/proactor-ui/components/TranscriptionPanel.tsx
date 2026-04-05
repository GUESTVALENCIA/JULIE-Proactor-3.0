/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSCRIPTION PANEL - Panel de transcripción en vivo para Proactor
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Muestra transcripciones en tiempo real:
 * - Voz del micrófono
 * - Capturas de teclado
 * - Mensajes de Sofia
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef } from 'react';

interface TranscriptEntry {
  text: string;
  time: string;
  isFinal: boolean;
  source?: 'mic' | 'keyboard' | 'sofia' | 'openclaw';
}

interface TranscriptionPanelProps {
  entries: TranscriptEntry[];
  currentTranscript?: string;
  isInterim?: boolean;
  filter?: 'all' | 'mic' | 'keyboard' | 'sofia';
  onFilterChange?: (filter: 'all' | 'mic' | 'keyboard' | 'sofia') => void;
  maxHeight?: number;
}

const SOURCE_ICONS: Record<string, string> = {
  mic: '🎤',
  keyboard: '⌨️',
  sofia: '🤖',
  openclaw: '🧠',
};

const SOURCE_COLORS: Record<string, string> = {
  mic: '#3b82f6',
  keyboard: '#f59e0b',
  sofia: '#8b5cf6',
  openclaw: '#22c55e',
};

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  entries,
  currentTranscript,
  isInterim = false,
  filter = 'all',
  onFilterChange,
  maxHeight = 120,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, currentTranscript]);

  // Detectar source del texto
  const getSourceFromText = (text: string): string => {
    if (text.startsWith('[⌨️') || text.startsWith('[keyboard')) return 'keyboard';
    if (text.startsWith('[Sofia') || text.startsWith('[OpenClaw')) return 'sofia';
    return 'mic';
  };

  // Filtrar entradas
  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => {
        const source = e.source || getSourceFromText(e.text);
        return source === filter;
      });

  // Contar por fuente
  const counts = entries.reduce((acc, e) => {
    const source = e.source || getSourceFromText(e.text);
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="transcription-panel">
      <div className="panel-header">
        <span className="panel-title">📝 Transcripción</span>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('all')}
          >
            Todo
          </button>
          <button
            className={`filter-btn ${filter === 'mic' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('mic')}
            style={{ borderColor: SOURCE_COLORS.mic }}
          >
            {SOURCE_ICONS.mic} {counts.mic || 0}
          </button>
          <button
            className={`filter-btn ${filter === 'keyboard' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('keyboard')}
            style={{ borderColor: SOURCE_COLORS.keyboard }}
          >
            {SOURCE_ICONS.keyboard} {counts.keyboard || 0}
          </button>
          <button
            className={`filter-btn ${filter === 'sofia' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('sofia')}
            style={{ borderColor: SOURCE_COLORS.sofia }}
          >
            {SOURCE_ICONS.sofia} {counts.sofia || 0}
          </button>
        </div>
      </div>

      <div className="transcript-list" ref={listRef} style={{ maxHeight }}>
        {filteredEntries.length === 0 && !currentTranscript ? (
          <div className="no-transcripts">Sin transcripciones</div>
        ) : (
          <>
            {filteredEntries.map((entry, i) => {
              const source = entry.source || getSourceFromText(entry.text);
              return (
                <div 
                  key={i} 
                  className="transcript-entry"
                  style={{ borderLeftColor: SOURCE_COLORS[source] || '#6b7280' }}
                >
                  <span className="entry-time">{entry.time}</span>
                  <span className="entry-text">{entry.text}</span>
                </div>
              );
            })}
            
            {/* Transcripción actual (interim) */}
            {currentTranscript && (
              <div 
                className={`transcript-entry current ${isInterim ? 'interim' : ''}`}
                style={{ borderLeftColor: SOURCE_COLORS.mic }}
              >
                <span className="entry-time">ahora</span>
                <span className="entry-text">
                  {currentTranscript}
                  {isInterim && <span className="typing-cursor">|</span>}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .transcription-panel {
          background: rgba(30, 30, 30, 0.9);
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .panel-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .filter-buttons {
          display: flex;
          gap: 4px;
        }

        .filter-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-size: 9px;
          padding: 2px 5px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          color: #fff;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .transcript-list {
          overflow-y: auto;
        }

        .no-transcripts {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          padding: 15px;
          font-style: italic;
        }

        .transcript-entry {
          padding: 4px 6px;
          margin-bottom: 3px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          border-left: 2px solid #6b7280;
          display: flex;
          gap: 6px;
          align-items: flex-start;
        }

        .transcript-entry.current {
          background: rgba(59, 130, 246, 0.1);
        }

        .transcript-entry.interim {
          opacity: 0.7;
        }

        .entry-time {
          font-size: 8px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
          min-width: 35px;
        }

        .entry-text {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.3;
          word-break: break-word;
        }

        .typing-cursor {
          animation: blink 1s infinite;
          color: #3b82f6;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TranscriptionPanel;
