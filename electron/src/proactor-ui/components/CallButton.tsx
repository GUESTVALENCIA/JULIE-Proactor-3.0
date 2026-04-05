import React from 'react';

interface Props {
  active: boolean;
  onClick: () => void;
}

export default function CallButton({ active, onClick }: Props) {
  return (
    <button
      className={`icon-btn call-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={active ? 'Colgar llamada' : 'Llamar a Juliet'}
    >
      {active ? '\uD83D\uDCF5' : '\uD83D\uDCDE'}
    </button>
  );
}
