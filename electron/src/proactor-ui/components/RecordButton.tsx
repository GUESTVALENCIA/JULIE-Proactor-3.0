import React from 'react';

interface Props {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function RecordButton({ active, onClick, disabled }: Props) {
  return (
    <button
      className={`icon-btn record-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={active ? 'Detener escucha' : 'Iniciar escucha'}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
    >
      {active ? '\u23F9' : '\uD83C\uDFA4'}
    </button>
  );
}
