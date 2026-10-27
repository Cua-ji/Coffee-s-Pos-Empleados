import React, { useState, useEffect } from 'react';
import Numpad from './Numpad.jsx';
import { verifyEmployeeCredentials } from '../data/employees.js';
import { playHapticSound } from '../utils/audio.js';

export default function EmployeePinScreen({ employee, onBack, onLoginSuccess, audioEnabled }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  function triggerError(msg) {
    setErrorMsg(msg);
    setShake(true);
    playHapticSound('error', audioEnabled);
    setTimeout(() => setShake(false), 500);
    setPin('');
  }

  function handleInput(key) {
    playHapticSound('click', audioEnabled);
    setErrorMsg('');

    if (key >= '0' && key <= '9') {
      if (pin.length < 4) {
        const nextPin = pin + key;
        setPin(nextPin);
        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
      }
    } else if (key === 'Backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (key === 'Enter') {
      verifyPin(pin);
    }
  }

  function verifyPin(pinToVerify) {
    if (!pinToVerify) {
      triggerError('Ingrese su PIN de seguridad');
      return;
    }

    if (verifyEmployeeCredentials(employee, pinToVerify)) {
      playHapticSound('success', audioEnabled);
      onLoginSuccess(employee);
    } else {
      triggerError('PIN incorrecto. Intente de nuevo.');
    }
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
        verifyPin(pin);
      } else if (key === 'Escape') {
        onBack();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, employee]);

  return (
    <section id="screen-employee-pin" className="screen-view active" aria-label="Ingreso de PIN de Seguridad">
      <div className="numpad-screen-container">
        <header className="top-action-bar">
          <button
            type="button"
            className="btn-nav-back"
            onClick={onBack}
            aria-label="Cambiar de empleado"
          >
            <span>&larr; Cambiar Empleado</span>
          </button>
        </header>

        <main className="kiosk-chassis">
          {/* Card de información del empleado */}
          <div className="employee-header-card">
            <div
              className="employee-avatar-badge"
              style={{ backgroundColor: employee?.color || '#0f172a' }}
            >
              {employee?.avatar || 'EP'}
            </div>
            <div className="employee-info-col">
              <div className="employee-name-text">
                {employee?.name || 'Empleado'}
              </div>
              <div className="employee-role-text">
                {employee?.id}
              </div>
            </div>
          </div>

          {/* Ventana de visualización de PIN */}
          <div className={`kiosk-display-window ${shake ? 'shake-anim' : ''}`}>
            <div className="display-meta-header">
              <span className="display-label">INGRESE PIN DE SEGURIDAD</span>
              <button
                type="button"
                className="display-clear-btn"
                onClick={() => {
                  playHapticSound('click', audioEnabled);
                  setPin('');
                  setErrorMsg('');
                }}
              >
                Limpiar
              </button>
            </div>

            <div className="display-digits-row">
              <div className="pin-slots-container">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`pin-slot-circle ${idx < pin.length ? 'filled' : ''}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="error-banner visible">
              {errorMsg}
            </div>
          )}

          <div className="kiosk-keypad-panel">
            <Numpad onInput={handleInput} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  const demoPin = employee?.id === '2' ? '0000' : '1234';
                  setPin(demoPin);
                  verifyPin(demoPin);
                }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Ingreso rápido (PIN: {employee?.id === '2' ? '0000' : '1234'})
              </button>
            </div>
          </div>

          <div className="kiosk-actions-bar">
            <button
              type="button"
              className="btn-confirm-action"
              onClick={() => verifyPin(pin)}
            >
              <span>INGRESAR (ENTER)</span>
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}
