/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INSIGHTS PANEL - Panel de insights para Proactor
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Muestra insights generados por SOFÍA:
 * - Riesgos detectados
 * - Oportunidades identificadas
 * - Decisiones pendientes
 * - Tareas sugeridas
 * 
 * Soporta dos modos:
 * - overlay: Panel superpuesto (comportamiento original)
 * - fixed: Panel fijo integrado en la UI
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';

interface Insight {
  type: string;
  text: string;
  timestamp: string;
  category?: 'risk' | 'opportunity' | 'decision' | 'task' | 'info';
  priority?: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: {
    label: string;
    payload: any;
  };
}

interface Props {
  insights: Insight[];
  visible: boolean;
  onClose: () => void;
  mode?: 'overlay' | 'fixed';
  maxHeight?: number;
  onInsightAction?: (insight: Insight) => void;
}

const TYPE_ICONS: Record<string, string> = {
  risk: '🔴',
  opportunity: '🟢',
  decision: '💬',
  task: '✅',
  info: '💡',
  warning: '⚠️',
  insight: '💡',
};

const TYPE_COLORS: Record<string, string> = {
  risk: '#ef4444',
  opportunity: '#22c55e',
  decision: '#3b82f6',
  task: '#f59e0b',
  info: '#8b5cf6',
  warning: '#f97316',
  insight: '#8b5cf6',
};

export default function InsightsPanel({ 
  insights, 
  visible, 
  onClose, 
  mode = 'overlay',
  maxHeight = 150,
  onInsightAction 
}: Props) {
  const [filter, setFilter] = useState<string | null>(null);

  const filteredInsights = filter 
    ? insights.filter(i => i.type === filter || i.category === filter)
    : insights;

  const insightCounts = insights.reduce((acc, i) => {
    const type = i.category || i.type || 'insight';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Modo overlay (comportamiento original)
  if (mode === 'overlay') {
    return (
      <div className={`insights-overlay ${visible ? 'visible' : ''}`}>
        <button className="insights-close" onClick={onClose}>
          x
        </button>
        <div className="insights-title">Insights</div>
        {insights.length === 0 ? (
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin insights</div>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className="insight-item">
              <span className="insight-icon">{TYPE_ICONS[insight.type] || '💬'}</span>
              {insight.text}
              <span className="insight-time">{insight.timestamp}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  // Modo fixed (panel integrado)
  return (
    <div className="insights-panel-fixed">
      <div className="panel-header">
        <span className="panel-title">💡 Insights</span>
        <span className="insight-count">{insights.length}</span>
      </div>

      {/* Filtros por tipo */}
      {Object.keys(insightCounts).length > 1 && (
        <div className="insight-filters">
          <button 
            className={`filter-btn ${!filter ? 'active' : ''}`}
            onClick={() => setFilter(null)}
          >
            Todos
          </button>
          {Object.entries(insightCounts).map(([type, count]) => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(filter === type ? null : type)}
              style={{ borderColor: TYPE_COLORS[type] || '#6b7280' }}
            >
              {TYPE_ICONS[type] || '💬'} {count}
            </button>
          ))}
        </div>
      )}

      <div className="insights-list" style={{ maxHeight }}>
        {filteredInsights.length === 0 ? (
          <div className="no-insights">Sin insights</div>
        ) : (
          filteredInsights.map((insight, i) => (
            <div 
              key={i} 
              className={`insight-item-fixed ${insight.priority === 'high' ? 'high-priority' : ''}`}
              style={{ borderLeftColor: TYPE_COLORS[insight.type] || TYPE_COLORS[insight.category || 'insight'] }}
            >
              <div className="insight-header">
                <span className="insight-icon">{TYPE_ICONS[insight.type] || TYPE_ICONS[insight.category || 'insight'] || '💬'}</span>
                <span className="insight-time">{insight.timestamp}</span>
              </div>
              <div className="insight-text">{insight.text}</div>
              {insight.actionable && insight.action && (
                <button 
                  className="insight-action-btn"
                  onClick={() => onInsightAction?.(insight)}
                >
                  {insight.action.label}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        .insights-panel-fixed {
          background: rgba(30, 30, 30, 0.9);
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .panel-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .insight-count {
          background: rgba(139, 92, 246, 0.3);
          color: #a855f7;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .insight-filters {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #a855f7;
          color: #fff;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .insights-list {
          overflow-y: auto;
        }

        .no-insights {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          padding: 15px;
          font-style: italic;
        }

        .insight-item-fixed {
          padding: 6px 8px;
          margin-bottom: 4px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          border-left: 2px solid #6b7280;
          transition: background 0.2s;
        }

        .insight-item-fixed:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .insight-item-fixed.high-priority {
          background: rgba(239, 68, 68, 0.1);
        }

        .insight-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .insight-icon {
          font-size: 10px;
        }

        .insight-time {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
        }

        .insight-text {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.3;
        }

        .insight-action-btn {
          margin-top: 4px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: none;
          color: white;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 9px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .insight-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
