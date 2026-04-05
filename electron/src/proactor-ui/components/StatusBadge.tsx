import React from 'react';
import type { AppState } from '../App';

interface Props {
  state: AppState;
}

const STATE_CONFIG: Record<AppState, { dotClass: string; label: string }> = {
  listening: { dotClass: 'listening', label: 'Escuchando' },
  processing: { dotClass: 'processing', label: 'Procesando' },
  'in-call': { dotClass: 'in-call', label: 'En llamada' },
  inactive: { dotClass: 'inactive', label: 'Inactivo' },
};

export default function StatusBadge({ state }: Props) {
  const config = STATE_CONFIG[state];

  return (
    <div className="status-badge">
      <span className={`status-dot ${config.dotClass}`} />
      <span className="status-label">{config.label}</span>
    </div>
  );
}
