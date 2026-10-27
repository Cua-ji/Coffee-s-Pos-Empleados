import React, { useState, useEffect } from 'react';
import Numpad from './Numpad.jsx';
import { findEmployee, isEmployeeAdmin, verifyEmployeeCredentials } from '../data/employees.js';
import { playHapticSound } from '../utils/audio.js';

export default function AdminAuthModal({
  isOpen,
  onClose,
  onSuccess,
  targetTitle = 'esta sección',
  audioEnabled
}) {
  const [step, setStep] = useState('id'); // 'id' | 'pin'
  const [managerId, setManagerId] = useState('');
  const [pin, setPin] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('id');
      setManagerId('');
      setPin('');
      setSelectedAdmin(null);
      setErrorMsg('');
      setShake(false);
    }
  }, [isOpen]);

  function triggerError(msg) {
    setErrorMsg(msg);
    setShake(true);
    playHapticSound('error', audioEnabled);
    setTimeout(() => setShake(false), 500);
    if (step === 'pin') {
      setPin('');
    }
  }

  function handleInput(key) {
    playHapticSound('click', audioEnabled);
    setErrorMsg('');

    if (step === 'id') {
      if (key >= '0' && key <= '9') {
        if (managerId.length < 10) {
          setManagerId((prev) => prev + key);
        }
      } else if (key === 'Backspace') {
        setManagerId((prev) => prev.slice(0, -1));
      } else if (key === 'Enter') {
        submitId();
      }
    } else if (step === 'pin') {
      if (key >= '0' && key <= '9') {
        if (pin.length < 4) {
          const nextPin = pin + key;
          setPin(nextPin);
          if (nextPin.length === 4) {
            submitPin(nextPin);
          }
        }
      } else if (key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (key === 'Enter') {
        submitPin(pin);
      }
    }
  }

  function submitId() {
    const cleanId = managerId.trim();
    if (!cleanId) {
      triggerError('Ingrese el número de empleado del gerente');
      return;
    }

    const emp = findEmployee(cleanId);
    if (!emp) {
      triggerError('Número de empleado no encontrado');
      return;
    }

    if (!isEmployeeAdmin(emp)) {
      triggerError('El empleado no cuenta con permisos de administrador');
      return;
    }

    setSelectedAdmin(emp);
    setStep('pin');
    setPin('');
    setErrorMsg('');
    playHapticSound('click', audioEnabled);
  }

  function submitPin(pinToVerify) {
    if (!pinToVerify || pinToVerify.length === 0) {
      triggerError('Ingrese el PIN de seguridad');
      return;
    }

    if (verifyEmployeeCredentials(selectedAdmin, pinToVerify)) {
      playHapticSound('success', audioEnabled);
      onSuccess(selectedAdmin);
      onClose();
    } else {
      triggerError('PIN incorrecto');
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      let key = e.key;
      if (key.startsWith('Numpad')) key = key.replace('Numpad', '');

      if (key >= '0' && key <= '9') {
        handleInput(key);
      } else if (key === 'Backspace') {
        handleInput('Backspace');
      } else if (key === 'Enter') {
        if (step === 'id') {
          submitId();
        } else {
          submitPin(pin);
        }
      } else if (key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, managerId, pin, selectedAdmin]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-window admin-auth-window"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px', padding: '1.75rem', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Acceso de Administrador
          </h3>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.88rem', lineHeight: 1.4 }}>
          {step === 'id'
            ? 'Ingrese el número de empleado del gerente o administrador para autorizar el acceso.'
            : `Ingrese el PIN de seguridad de ${selectedAdmin?.name || 'Administrador'}:`}
        </p>

        {/* Display Pantalla */}
        <div
          className={`kiosk-display-window ${shake ? 'shake-anim' : ''}`}
          style={{ margin: '0 auto 1.25rem', minHeight: '75px', maxWidth: '280px' }}
        >
          <div className="display-meta-header">
            <span className="display-label">
              {step === 'id' ? 'NÚMERO DE EMPLEADO' : 'PIN DE SEGURIDAD'}
            </span>
            <button
              type="button"
              className="display-clear-btn"
              onClick={() => {
                playHapticSound('click', audioEnabled);
                if (step === 'id') {
                  setManagerId('');
                } else {
                  setPin('');
                }
                setErrorMsg('');
              }}
            >
              Limpiar
            </button>
          </div>

          <div className="display-digits-row">
            {step === 'id' ? (
              <>
                <span className="display-digits-text" style={{ fontSize: '2.1rem' }}>
                  {managerId}
                </span>
                <span className="display-cursor"></span>
              </>
            ) : (
              <div className="pin-slots-container">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`pin-slot-circle ${idx < pin.length ? 'filled' : ''}`}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="error-banner visible" style={{ marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Teclado numérico */}
        <div className="kiosk-keypad-panel" style={{ margin: '0 auto', maxWidth: '280px' }}>
          <Numpad onInput={handleInput} />
        </div>

        {/* Botones de acción */}
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.6rem' }}>
          {step === 'pin' ? (
            <button
              type="button"
              onClick={() => {
                setStep('id');
                setPin('');
                setErrorMsg('');
              }}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={() => (step === 'id' ? submitId() : submitPin(pin))}
            style={{
              flex: 1.4,
              padding: '0.85rem',
              borderRadius: '9999px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
            }}
          >
            {step === 'id' ? 'Continuar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}
