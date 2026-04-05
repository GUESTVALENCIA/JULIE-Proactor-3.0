/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOFIA BRAIN PANEL - Panel del cerebro de JULIET para Proactor
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Muestra el estado mental de JULIET (OpenClaw):
 * - Reflexión actual
 * - Tareas en progreso
 * - Decisiones pendientes
 * - Acciones propuestas (clickables)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  text: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in_progress' | 'done';
  timestamp?: number;
}

interface ProposedAction {
  id: string;
  label: string;
  description?: string;
  type: 'execute' | 'send_to_juliet' | 'open_link' | 'approve';
  payload?: any;
}

interface JulietBrainPanelProps {
  reflection?: string;
  tasks?: Task[];
  proposedActions?: ProposedAction[];
  thinking?: boolean;
  openClawConnected?: boolean;
  onActionClick?: (action: ProposedAction) => void;
  onTaskToggle?: (taskId: string) => void;
}

export const JulietBrainPanel: React.FC<JulietBrainPanelProps> = ({
  reflection = '',
  tasks = [],
  proposedActions = [],
  thinking = false,
  openClawConnected = false,
  onActionClick,
  onTaskToggle,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [displayReflection, setDisplayReflection] = useState('');

  // Efecto de typing para la reflexión
  useEffect(() => {
    if (!reflection) {
      setDisplayReflection('');
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < reflection.length) {
        setDisplayReflection(reflection.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 15); // 15ms por carácter

    return () => clearInterval(interval);
  }, [reflection]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'execute': return '▶️';
      case 'send_to_juliet': return '💬';
      case 'open_link': return '🔗';
      case 'approve': return '✅';
      default: return '⚡';
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 5);
  const hasContent = reflection || activeTasks.length > 0 || proposedActions.length > 0;

  return (
    <div className="juliet-brain-panel">
      <div className="panel-header" onClick={() => setExpanded(!expanded)}>
        <span className="panel-title">
          🧠 Juliet Brain
          {thinking && <span className="thinking-indicator">...</span>}
        </span>
        <span className={`connection-status ${openClawConnected ? 'connected' : 'disconnected'}`}>
          {openClawConnected ? '●' : '○'}
        </span>
      </div>

      <div className={`panel-content ${expanded ? 'expanded' : ''}`}>
        {!hasContent ? (
          <div className="no-content">
            {openClawConnected ? 'Esperando contexto...' : 'OpenClaw desconectado'}
          </div>
        ) : (
          <>
            {/* Reflexión actual */}
            {displayReflection && (
              <div className="reflection-section">
                <div className="section-label">💭 Reflexión</div>
                <div className="reflection-text">
                  {displayReflection}
                  {thinking && <span className="cursor-blink">|</span>}
                </div>
              </div>
            )}

            {/* Tareas activas */}
            {activeTasks.length > 0 && (
              <div className="tasks-section">
                <div className="section-label">📋 Tareas ({activeTasks.length})</div>
                <div className="tasks-list">
                  {activeTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`task-item ${task.status === 'in_progress' ? 'in-progress' : ''}`}
                      onClick={() => onTaskToggle?.(task.id)}
                    >
                      <span 
                        className="task-priority" 
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      />
                      <span className="task-text">{task.text}</span>
                      {task.status === 'in_progress' && (
                        <span className="task-status">⏳</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones propuestas */}
            {proposedActions.length > 0 && (
              <div className="actions-section">
                <div className="section-label">⚡ Acciones</div>
                <div className="actions-list">
                  {proposedActions.slice(0, 3).map((action) => (
                    <button
                      key={action.id}
                      className="action-button"
                      onClick={() => onActionClick?.(action)}
                      title={action.description}
                    >
                      {getActionIcon(action.type)} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .juliet-brain-panel {
          background: rgba(30, 30, 30, 0.9);
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid rgba(147, 51, 234, 0.3);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .panel-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .thinking-indicator {
          color: #a855f7;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .connection-status {
          font-size: 10px;
        }

        .connection-status.connected {
          color: #22c55e;
        }

        .connection-status.disconnected {
          color: #ef4444;
        }

        .panel-content {
          margin-top: 8px;
          max-height: 150px;
          overflow-y: auto;
          transition: max-height 0.3s ease;
        }

        .panel-content.expanded {
          max-height: 300px;
        }

        .no-content {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          padding: 15px;
          font-style: italic;
        }

        .section-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .reflection-section {
          margin-bottom: 10px;
        }

        .reflection-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
          padding: 6px;
          background: rgba(147, 51, 234, 0.1);
          border-radius: 6px;
          border-left: 2px solid #a855f7;
        }

        .cursor-blink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .tasks-section {
          margin-bottom: 10px;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .task-item {
          display: flex;
          align-items: center;
          padding: 4px 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .task-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .task-item.in-progress {
          border-left: 2px solid #3b82f6;
        }

        .task-priority {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 6px;
          flex-shrink: 0;
        }

        .task-text {
          flex: 1;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-status {
          font-size: 10px;
          margin-left: 4px;
        }

        .actions-section {
          margin-bottom: 6px;
        }

        .actions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .action-button {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .action-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default JulietBrainPanel;
