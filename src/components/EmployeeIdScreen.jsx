import React, { useState, useEffect } from 'react';
import Numpad from './Numpad.jsx';
import { EMPLOYEES, findEmployee } from '../data/employees.js';
import { playHapticSound } from '../utils/audio.js';

export default function EmployeeIdScreen({ onBack, onEmployeeIdentified, audioEnabled }) {
  const [employeeId, setEmployeeId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  function triggerError(msg) {
    setErrorMsg(msg);
    setShake(true);
    playHapticSound('error', audioEnabled);
    setTimeout(() => setShake(false), 500);
  }

  function handleInput(key) {
    playHapticSound('click', audioEnabled);
    setErrorMsg('');

    if (key >= '0' && key <= '9') {
      if (employeeId.length < 10) {
        setEmployeeId((prev) => prev + key);
      }
    } else if (key === 'Backspace') {
      setEmployeeId((prev) => prev.slice(0, -1));
    } else if (key === 'Enter') {
      submitId();
    }
  }

  function submitId(idToSubmit = employeeId) {
    const clean = idToSubmit.trim();
    if (!clean) {
      triggerError('Por favor ingrese su número de empleado');
      return;
    }

    const emp = findEmployee(clean);
    if (!emp) {
      triggerError('Empleado no encontrado');
      return;
    }

    playHapticSound('success', audioEnabled);
    onEmployeeIdentified(emp);
  }

  // Physical keyboard listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      let key = e.key;
      if (key.startsWith('Numpad')) key = key.replace('Numpad', '');

      if (key >= '0' && key <= '9') {
        handleInput(key);
      } else if (key === 'Backspace') {
        handleInput('Backspace');
      } else if (key === 'Enter') {
        submitId();
      } else if (key === 'Escape') {
        onBack();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [employeeId]);

  return (
    <section id="screen-employee-id" className="screen-view active" aria-label="Ingreso de Número de Empleado">
      <div className="numpad-screen-container">
        <header className="top-action-bar">
          <button
            type="button"
            className="btn-nav-back"
            onClick={onBack}
            aria-label="Volver a la pantalla de bienvenida"
          >
            <span>&larr; Volver</span>
          </button>
        </header>

        <main className="kiosk-chassis">
          <div className={`kiosk-display-window ${shake ? 'shake-anim' : ''}`}>
            <div className="display-meta-header">
              <span className="display-label">NÚMERO DE EMPLEADO</span>
              <button
                type="button"
                className="display-clear-btn"
                onClick={() => {
                  playHapticSound('click', audioEnabled);
                  setEmployeeId('');
                  setErrorMsg('');
                }}
              >
                Limpiar
              </button>
            </div>

            <div className="display-digits-row">
              <span className="display-digits-text">{employeeId}</span>
              <span className="display-cursor"></span>
            </div>
          </div>

          {errorMsg && (
            <div className="error-banner visible">
              {errorMsg}
            </div>
          )}

          <div className="kiosk-keypad-panel">
            <Numpad onInput={handleInput} />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setEmployeeId('1');
                  submitId('1');
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                Admin (ID: 1)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmployeeId('2');
                  submitId('2');
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  cursor: 'pointer'
                }}
              >
                Cajero Demo (ID: 2)
              </button>
            </div>
          </div>

          <div className="kiosk-actions-bar">
            <button
              type="button"
              className="btn-confirm-action"
              onClick={() => submitId()}
            >
              <span>ACEPTAR (ENTER)</span>
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}
