import React, { useState, useEffect } from 'react';

export default function NoteModal({ isOpen, onClose, initialNote, onSaveNote }) {
  const [noteText, setNoteText] = useState('');

  const quickNotes = [
    'Sin cebolla',
    'Extra salsa',
    'Bien cocido',
    'Término medio',
    'Leche deslactosada',
    'Leche de avena',
    'Para después'
  ];

  useEffect(() => {
    if (isOpen) {
      setNoteText(initialNote || '');
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  function appendChip(text) {
    if (!noteText.trim()) {
      setNoteText(text);
    } else {
      setNoteText((prev) => `${prev}, ${text}`);
    }
  }

  function handleSave() {
    onSaveNote(noteText.trim());
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Instrucciones de Cocina</h2>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {quickNotes.map((q) => (
              <button
                key={q}
                type="button"
                className="demo-chip-btn"
                onClick={() => appendChip(q)}
              >
                {q}
              </button>
            ))}
          </div>

          <textarea
            rows="3"
            placeholder="Escriba especificaciones especiales (ej. salsa aparte, sin sal)..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '0.75rem',
              fontFamily: 'inherit',
              fontSize: '0.92rem',
              outline: 'none',
              resize: 'none'
            }}
          />

          <button
            type="button"
            className="btn-confirm-action"
            style={{ background: '#0f172a', width: '100%' }}
            onClick={handleSave}
          >
            <span>Guardar Nota en Producto</span>
          </button>
        </div>
      </div>
    </div>
  );
}
