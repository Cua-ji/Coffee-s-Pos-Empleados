import React, { useState } from 'react';
import { playHapticSound } from '../utils/audio.js';
import { saveMenuProducts, MENU_PRODUCTS } from '../data/menuData.js';
import { getEmployees, saveEmployees } from '../data/employees.js';
import { hashAccountPassword, hashEmployeePin } from '../utils/crypto.js';
import {
  saveTenantInLocalRegistry,
  verifyLocalTenantCredentials,
  initDefaultTestState,
  DEFAULT_TEST_ACCOUNT
} from '../utils/tenant.js';

export default function SetupAccountScreen({ onAccountConfigured, audioEnabled = true }) {
  // Modo de pantalla: 'choice' (¿Nuevo o ya tienes cuenta?) | 'login' (Iniciar sesión) | 'wizard' (Asistente paso a paso)
  const [screenMode, setScreenMode] = useState('choice');

  // Paso actual del Wizard (1 a 6)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Paso 1: Nombre completo
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Paso 2: Negocio y Terminal
  const [businessName, setBusinessName] = useState('');
  const [terminalName, setTerminalName] = useState('Caja Principal');

  // Paso 3: Correo y Contraseña
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Paso 4: Licencia
  const [licenseType, setLicenseType] = useState('demo'); // 'demo' | 'custom'
  const [licenseKey, setLicenseKey] = useState('TAFFY-DEMO-2026');


  // Paso 5: Menú y CSV
  const [menuChoice, setMenuChoice] = useState('default'); // 'default' | 'csv' | 'empty'
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedCsvProducts, setParsedCsvProducts] = useState([]);
  const [csvFeedback, setCsvFeedback] = useState('');

  // Paso 6: Credenciales de Administrador en Caja
  const [adminEmployeeId, setAdminEmployeeId] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');

  // Campos para "Ya tengo cuenta" (Login rápido en otra terminal)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTerminal, setLoginTerminal] = useState('Caja Principal');

  // Errores y estado de carga
  const [errorMsg, setErrorMsg] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  // =========================================================================
  // Manejo de Navegación del Wizard
  // =========================================================================
  function validateCurrentStep() {
    setErrorMsg('');

    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Por favor ingresa tu nombre y apellido para continuar.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!businessName.trim()) {
        setErrorMsg('Por favor ingresa el nombre de tu cafetería o restaurante.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Por favor ingresa un correo electrónico válido.');
        return false;
      }
      if (password.length < 4) {
        setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden. Verifícalas.');
        return false;
      }
    } else if (currentStep === 4) {
      if (licenseType === 'custom' && !licenseKey.trim()) {
        setErrorMsg('Por favor ingresa tu código de licencia.');
        return false;
      }
    } else if (currentStep === 5) {
      if (menuChoice === 'csv' && parsedCsvProducts.length === 0) {
        setErrorMsg('Por favor selecciona un archivo CSV válido o elige otra opción.');
        return false;
      }
    } else if (currentStep === 6) {
      if (!adminEmployeeId.trim()) {
        setErrorMsg('Ingresa un número o ID de empleado para el Administrador.');
        return false;
      }
      if (!adminPin || adminPin.length < 4) {
        setErrorMsg('El PIN de administrador debe ser de al menos 4 dígitos.');
        return false;
      }
      if (adminPin !== confirmAdminPin) {
        setErrorMsg('Los PINs de administrador no coinciden.');
        return false;
      }
    }

    return true;
  }

  function handleNextStep() {
    if (!validateCurrentStep()) return;
    playHapticSound('click', audioEnabled);
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePrevStep() {
    playHapticSound('click', audioEnabled);
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setScreenMode('choice');
    }
  }

  // =========================================================================
  // Importación y Exportación de CSV para el Menú
  // =========================================================================
  function handleDownloadCsvTemplate() {
    playHapticSound('click', audioEnabled);
    const headers = 'nombre,categoria,precio,codigo,descripcion';
    const sampleRows = [
      'Café Americano,cafe,42.00,CAF-01,Extracción espresso doble con agua caliente',
      'Cappuccino Italiano,cafe,55.00,CAF-03,Espresso con leche vaporizada y espuma',
      'Croissant de Almendras,postres,65.00,POS-03,Hojaldrado artesanal con almendras',
      'Chilaquiles Verdes,desayunos,135.00,DES-01,Totopos con salsa verde y pechuga',
      'Papas Rústicas,entradas,75.00,ENT-01,Sazonadas con romero y alioli'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...sampleRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_menu_taffy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleCsvFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvFeedback('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');

        if (lines.length <= 1) {
          setErrorMsg('El archivo CSV está vacío o solo contiene encabezados.');
          return;
        }

        // Detectar si la primera fila es encabezado
        const startIndex = lines[0].toLowerCase().includes('nombre') ? 1 : 0;
        const parsed = [];

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 3 && cols[0]) {
            const name = cols[0];
            const categoryId = cols[1] || 'cafe';
            const price = parseFloat(cols[2]) || 0;
            const sku = cols[3] || `PRD-${i + 1}`;
            const desc = cols[4] || '';

            parsed.push({
              id: `csv-${Date.now()}-${i}`,
              name,
              categoryId,
              price,
              sku,
              desc,
              favorite: false
            });
          }
        }

        if (parsed.length === 0) {
          setErrorMsg('No se pudieron leer productos válidos. Revisa el formato CSV.');
        } else {
          setParsedCsvProducts(parsed);
          setCsvFeedback(`✅ Se importaron con éxito ${parsed.length} productos listos para cargar.`);
          playHapticSound('click', audioEnabled);
        }
      } catch (err) {
        setErrorMsg('Error al leer el archivo CSV. Asegúrate de que sea texto delimitado por comas.');
      }
    };
    reader.readAsText(file);
  }

  // =========================================================================
  // Finalización del Asistente y Registro (Con Hash y Aislamiento de Tenant)
  // =========================================================================
  async function handleFinishWizard() {
    if (!validateCurrentStep()) return;
    setIsFinishing(true);
    playHapticSound('click', audioEnabled);

    const cleanEmail = email.trim().toLowerCase();
    const cleanAdminName = `${firstName.trim()} ${lastName.trim()}`;
    const cleanAdminId = adminEmployeeId.trim();
    const cleanAdminPin = adminPin.trim();

    // Aplicar hash criptográfico a la contraseña de la cuenta y al PIN del administrador
    const hashedAccountPassword = hashAccountPassword(password, cleanEmail);
    const hashedAdminPin = hashEmployeePin(cleanAdminPin, cleanEmail, cleanAdminId);

    // 1. Preparar datos de cuenta y negocio (con tenantId aislado)
    let accountData = {
      id: `tenant_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      tenantId: cleanEmail,
      ownerName: cleanAdminName,
      businessName: businessName.trim(),
      email: cleanEmail,
      terminalName: terminalName.trim() || 'Caja Principal',
      licenseKey: licenseType === 'custom' ? licenseKey.trim() : 'TAFFY-DEMO-2026',
      adminEmployeeId: cleanAdminId,
      configuredAt: new Date().toISOString()
    };

    // 2. Configurar Administrador ÚNICO para esta cuenta con PIN hasheado
    const initials = `${firstName[0] || 'A'}${lastName[0] || 'D'}`.toUpperCase();
    const adminEmployee = {
      id: cleanAdminId,
      tenantId: cleanEmail,
      name: cleanAdminName,
      role: 'Administrador',
      pin: hashedAdminPin,
      avatar: initials,
      color: '#0f172a',
      isAdmin: true,
      createdAt: new Date().toISOString()
    };

    // 3. Configurar Menú según elección aislado por tenantId
    let initialProducts = [];
    if (menuChoice === 'csv' && parsedCsvProducts.length > 0) {
      initialProducts = parsedCsvProducts.map((p, i) => ({
        ...p,
        id: p.id || `prod_${Date.now()}_${i}`,
        tenantId: cleanEmail
      }));
    } else if (menuChoice === 'empty') {
      initialProducts = [];
    } else {
      initialProducts = MENU_PRODUCTS.map((p, i) => ({
        ...p,
        id: `prod_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}_${i + 1}`,
        tenantId: cleanEmail
      }));
    }

    // Configuración local del asistente
    localStorage.setItem('taffy_account', JSON.stringify(accountData));
    saveTenantInLocalRegistry(accountData, hashedAccountPassword);

    // Guardar sesión de cuenta y registro local con hash de contraseña
    localStorage.setItem('taffy_account', JSON.stringify(accountData));
    saveTenantInLocalRegistry(accountData, hashedAccountPassword);

    // Guardar empleados y productos aislados bajo el tenantId de esta cuenta
    saveEmployees([adminEmployee], cleanEmail);
    saveMenuProducts(initialProducts, cleanEmail);

    setTimeout(() => {
      onAccountConfigured(accountData);
      setIsFinishing(false);
    }, 400);
  }

  // Iniciar sesión rápida para otra terminal validando contraseña hasheada y aislando su Tenant
  async function handleQuickLoginSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Ingresa tu correo y contraseña.');
      return;
    }

    setIsFinishing(true);
    playHapticSound('click', audioEnabled);

    const hashedInputPassword = hashAccountPassword(cleanPass, cleanEmail);



    // 2. Validación en registro local con contraseña hasheada (Modo Offline / Local)
    const localAuth = verifyLocalTenantCredentials(cleanEmail, cleanPass);
    if (!localAuth.success && !localAuth.notFoundLocally) {
      setErrorMsg(localAuth.message);
      setIsFinishing(false);
      return;
    }

    setTimeout(async () => {
      const accountData = localAuth.account
        ? {
            ...localAuth.account,
            tenantId: cleanEmail,
            terminalName: loginTerminal.trim() || localAuth.account.terminalName || 'Caja Principal',
            configuredAt: new Date().toISOString()
          }
        : {
            id: `tenant_${cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            tenantId: cleanEmail,
            email: cleanEmail,
            businessName: 'Mi Cafetería',
            terminalName: loginTerminal.trim() || 'Caja Principal',
            configuredAt: new Date().toISOString()
          };

      localStorage.setItem('taffy_account', JSON.stringify(accountData));
      saveTenantInLocalRegistry(accountData, hashedInputPassword);

      onAccountConfigured(accountData);
      setIsFinishing(false);
    }, 400);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '1.5rem',
        boxSizing: 'border-box',
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif"
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: screenMode === 'wizard' ? '580px' : '460px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          padding: '2.5rem',
          boxSizing: 'border-box',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Cabecera / Marca */}
        <div style={{ textAlign: 'center', marginBottom: screenMode === 'wizard' ? '1.5rem' : '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: '#0f172a',
              color: '#ffffff',
              marginBottom: '0.8rem',
              boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)'
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem', letterSpacing: '-0.03em' }}>
            Taffy pos
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Punto de Venta para Cafeterías &bull; Configuración Inicial
          </p>
        </div>

        {/* Barra de Progreso en modo Asistente Guiado */}
        {screenMode === 'wizard' && (
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Paso {currentStep} de {totalSteps}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                {currentStep === 1 && 'Tu Nombre'}
                {currentStep === 2 && 'Tu Negocio'}
                {currentStep === 3 && 'Cuenta de Acceso'}
                {currentStep === 4 && 'Licencia'}
                {currentStep === 5 && 'Menú & Catálogo'}
                {currentStep === 6 && 'Admin en Caja'}
              </span>
            </div>
            {/* Barra visual de porcentaje */}
            <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(currentStep / totalSteps) * 100}%`,
                  background: '#0f172a',
                  borderRadius: '9999px',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* PANTALLA INICIAL: ELECCIÓN (NUEVO O YA TIENE CUENTA)           */}
        {/* ============================================================== */}
        {screenMode === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#334155', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              ¿Cómo deseas iniciar en este equipo?
            </p>

            <button
              type="button"
              onClick={() => {
                playHapticSound('click', audioEnabled);
                setErrorMsg('');
                setScreenMode('wizard');
                setCurrentStep(1);
              }}
              style={{
                width: '100%',
                padding: '1.15rem',
                borderRadius: '14px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                fontSize: '1.02rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem'
              }}
            >
              <span>No tengo una cuenta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound('click', audioEnabled);
                setErrorMsg('');
                setScreenMode('login');
              }}
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '14px',
                border: '2px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.98rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Ya tengo cuenta en Taffy POS
            </button>

            <button
              type="button"
              onClick={() => {
                playHapticSound('click', audioEnabled);
                setErrorMsg('');
                const { account: testAcc } = initDefaultTestState();
                try {
                  localStorage.removeItem('taffy_unlinked_manual');
                } catch {}
                onAccountConfigured(testAcc);
              }}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: '1px dashed #94a3b8',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem'
              }}
            >
              <span>⚡ Usar Cuenta de Pruebas (Demo)</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* ASISTENTE GUIADO: PASO 1 - NOMBRE COMPLETO                      */}
        {/* ============================================================== */}
        {screenMode === 'wizard' && currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.4rem' }}>
                ¿Cuál es tu nombre completo?
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Serás registrado como el propietario principal del establecimiento.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Apellido
                </label>
                <input
                  type="text"
                  placeholder="Tu apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Volver
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  padding: '0.85rem 1.6rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ASISTENTE GUIADO: PASO 2 - NOMBRE DE LA CAFETERÍA              */}
        {/* ============================================================== */}
        {screenMode === 'wizard' && currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.4rem' }}>
                ¿Cuál es el nombre de tu cafetería?
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Este nombre aparecerá en la pantalla principal y en los tickets de venta.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Nombre del Negocio o Restaurante
              </label>
              <input
                type="text"
                placeholder="ej. Café Central, La Taza Dorada, Taffy Coffee"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Identificador de esta Terminal / Equipo
              </label>
              <input
                type="text"
                placeholder="ej. Caja Principal, Kike PC, Barra, Cocina"
                value={terminalName}
                onChange={(e) => setTerminalName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  padding: '0.85rem 1.6rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ASISTENTE GUIADO: PASO 3 - CORREO Y CONTRASEÑA                  */}
        {/* ============================================================== */}
        {screenMode === 'wizard' && currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.4rem' }}>
                Tu cuenta de acceso y seguridad
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Úsala para administrar tu cafetería y vincular otras computadoras o tablets.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="admin@tu-cafeteria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  padding: '0.85rem 1.6rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ASISTENTE GUIADO: PASO 4 - LICENCIA DE TAFFY POS               */}
        {/* ============================================================== */}
        {screenMode === 'wizard' && currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.4rem' }}>
                ¿Cuentas con una licencia para Taffy POS?
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Selecciona si ya tienes un código de activación o deseas comenzar en modo demo.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                onClick={() => {
                  setLicenseType('demo');
                  setLicenseKey('TAFFY-DEMO-2026');
                }}
                style={{
                  padding: '1rem',
                  borderRadius: '14px',
                  border: licenseType === 'demo' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: licenseType === 'demo' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <input
                  type="radio"
                  name="licenseOption"
                  checked={licenseType === 'demo'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                    Usar Licencia de Demostración (30 días)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Clave automática: TAFFY-DEMO-2026 (Ideal para pruebas y presentación)
                  </div>
                </div>
              </div>

              <div
                onClick={() => setLicenseType('custom')}
                style={{
                  padding: '1rem',
                  borderRadius: '14px',
                  border: licenseType === 'custom' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: licenseType === 'custom' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <input
                  type="radio"
                  name="licenseOption"
                  checked={licenseType === 'custom'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                    Tengo un Código de Licencia
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Ingresar clave personalizada proporcionada por tu proveedor
                  </div>
                </div>
              </div>

              {licenseType === 'custom' && (
                <div style={{ marginTop: '0.2rem' }}>
                  <input
                    type="text"
                    placeholder="ej. TAFFY-PRO-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  padding: '0.85rem 1.6rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ASISTENTE GUIADO: PASO 5 - MENÚ Y CATÁLOGO (CON IMPORTAR/CSV)  */}
        {/* ============================================================== */}
        {screenMode === 'wizard' && currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem' }}>
                Configuración del Menú
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                ¿Cómo deseas inicializar los productos para tu cafetería?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Opción 1: Menú Predeterminado */}
              <div
                onClick={() => setMenuChoice('default')}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: menuChoice === 'default' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: menuChoice === 'default' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <input
                  type="radio"
                  name="menuOption"
                  checked={menuChoice === 'default'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    Cargar Menú Completo de Cafetería (Recomendado)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    24 productos listos (Café, Lattes, Panadería, Desayunos y Snacks)
                  </div>
                </div>
              </div>

              {/* Opción 2: Importar CSV */}
              <div
                onClick={() => setMenuChoice('csv')}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: menuChoice === 'csv' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: menuChoice === 'csv' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <input
                  type="radio"
                  name="menuOption"
                  checked={menuChoice === 'csv'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    Importar Menú desde Archivo CSV
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Carga un archivo de Excel/CSV con tus propios productos
                  </div>
                </div>
              </div>

              {/* Controles para CSV cuando está activo */}
              {menuChoice === 'csv' && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px dashed #94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '8px',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      📁 Seleccionar archivo .csv
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      style={{
                        padding: '0.55rem 0.9rem',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⬇ Descargar Plantilla CSV
                    </button>
                  </div>

                  {csvFileName && (
                    <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                      Archivo cargado: <strong>{csvFileName}</strong>
                    </div>
                  )}

                  {csvFeedback && (
                    <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 700 }}>
                      {csvFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Opción 3: Menú Vacío */}
              <div
                onClick={() => setMenuChoice('empty')}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  border: menuChoice === 'empty' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: menuChoice === 'empty' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <input
                  type="radio"
                  name="menuOption"
                  checked={menuChoice === 'empty'}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#0f172a' }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    Empezar con Menú Vacío
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Crearás tus productos después desde el panel de administración
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  padding: '0.85rem 1.6rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ASISTENTE GUIADO: PASO 6 - CREDENCIALES ADMIN EN CAJA           */}
        {/* ============================================================== */}
        {screenMode === 'wizard' && currentStep === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem' }}>
                Acceso de Administrador en Caja
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Define tu Número de Empleado y PIN para abrir turno y autorizar operaciones maestras.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Número o ID de Empleado Maestro
              </label>
              <input
                type="text"
                placeholder="ej. 101 o tu código de empleado"
                value={adminEmployeeId}
                onChange={(e) => setAdminEmployeeId(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  PIN Maestro (4 dígitos)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="ej. 1234"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1.1rem',
                    letterSpacing: '0.2em',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="ej. 1234"
                  value={confirmAdminPin}
                  onChange={(e) => setConfirmAdminPin(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishWizard()}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1.1rem',
                    letterSpacing: '0.2em',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isFinishing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Atrás
              </button>
              <button
                type="button"
                onClick={handleFinishWizard}
                disabled={isFinishing}
                style={{
                  padding: '0.95rem 1.8rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: isFinishing ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
                }}
              >
                {isFinishing ? 'Guardando configuración...' : 'Finalizar y Entrar al Sistema'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PANTALLA: YA TENGO CUENTA (INICIAR SESIÓN RÁPIDO)              */}
        {/* ============================================================== */}
        {screenMode === 'login' && (
          <form onSubmit={handleQuickLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@cafeteria.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Tu contraseña de acceso"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Identificador de esta Terminal / Equipo
              </label>
              <input
                type="text"
                placeholder="ej. Caja Principal, Kike PC, Cocina"
                value={loginTerminal}
                onChange={(e) => setLoginTerminal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isFinishing}
              style={{
                width: '100%',
                padding: '1.05rem',
                borderRadius: '14px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                fontSize: '0.98rem',
                fontWeight: 800,
                cursor: isFinishing ? 'wait' : 'pointer',
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
              }}
            >
              {isFinishing ? 'Iniciando sesión...' : 'Entrar y Vincular Terminal'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setScreenMode('choice');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                &larr; Volver a opciones
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
