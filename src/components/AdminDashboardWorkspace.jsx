import React, { useState } from 'react';
import ShiftWorkspace from './ShiftWorkspace.jsx';
import MenuManagementWorkspace from './MenuManagementWorkspace.jsx';
import UserManagementWorkspace from './UserManagementWorkspace.jsx';
import HistoryWorkspace from './HistoryWorkspace.jsx';

export default function AdminDashboardWorkspace({
  currentEmployee,
  account,
  onBack,
  onReprintOrder,
  onLogout,
  onUnlinkAccount
}) {
  const [activeAdminTab, setActiveAdminTab] = useState('shift');

  const menuItems = [
    {
      id: 'shift',
      label: 'Corte de Caja',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    },
    {
      id: 'menu-admin',
      label: 'Editar Menú',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )
    },
    {
      id: 'users-admin',
      label: 'Personal y Usuarios',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'history',
      label: 'Historial de Pedidos',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 'license',
      label: 'Terminal y Licencia',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#f8fafc',
        fontFamily: 'var(--font-inter, sans-serif)'
      }}
    >
      {/* ============================================================== */}
      {/* BARRA LATERAL IZQUIERDA (Estilo Supabase Dashboard)            */}
      {/* ============================================================== */}
      <aside
        style={{
          width: '270px',
          minWidth: '270px',
          background: '#0b1120',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 0.9rem',
          boxSizing: 'border-box',
          userSelect: 'none'
        }}
      >
        {/* Parte Superior del Sidebar: Negocio y Navegación */}
        <div>
          {/* Encabezado del Local */}
          <div
            style={{
              padding: '0.5rem 0.6rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                textTransform: 'uppercase'
              }}
            >
              {account?.businessName || 'Coffee´s Pos'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontWeight: 600,
                marginTop: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981'
                }}
              />
              <span>Panel de Administración</span>
            </div>
          </div>

          {/* Menú de Opciones */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {menuItems.map((item) => {
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveAdminTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#1e293b' : 'transparent',
                    color: isActive ? '#38bdf8' : '#cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#cbd5e1';
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#38bdf8' : '#94a3b8' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Parte Inferior del Sidebar: Volver y Cerrar Sesión */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {/* Volver al Punto de Venta */}
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Volver a Ventas</span>
          </button>

          {/* Cerrar Sesión (Solo Admin) */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* ÁREA DE CONTENIDO PRINCIPAL                                    */}
      {/* ============================================================== */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* Barra Superior del Panel */}
        <header
          style={{
            padding: '1rem 2rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              {menuItems.find((m) => m.id === activeAdminTab)?.label || 'Administración'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
              Terminal: {account?.terminalName || 'Caja Principal'} &bull; {account?.businessName || 'Cafetería'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#0f172a',
                background: '#f1f5f9',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0'
              }}
            >
              Administrador: {currentEmployee?.name || 'Gerencia'}
            </div>
          </div>
        </header>

        {/* Vista del Contenido Activo */}
        <div style={{ flex: 1, padding: '1.75rem 2rem', boxSizing: 'border-box' }}>
          {activeAdminTab === 'shift' && (
            <ShiftWorkspace cashierName={currentEmployee?.name} />
          )}

          {activeAdminTab === 'menu-admin' && <MenuManagementWorkspace />}

          {activeAdminTab === 'users-admin' && (
            <UserManagementWorkspace currentEmployee={currentEmployee} />
          )}

          {activeAdminTab === 'history' && (
            <HistoryWorkspace onReprintOrder={onReprintOrder} />
          )}

          {/* ============================================================== */}
          {/* VISTA DEDICADA: TERMINAL Y LICENCIA                            */}
          {/* ============================================================== */}
          {activeAdminTab === 'license' && (
            <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Tarjeta 1: Estado de la Licencia */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Licencia Comercial Coffee´s Pos
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Información sobre la suscripción y derechos de uso de la terminal
                    </p>
                  </div>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      border: '1px solid #bbf7d0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                    Licencia Activa
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    background: '#f8fafc',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Plan Registrado
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      Plan Cafetería Pro
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Capacidad
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      Multiterminal (1 de 5 cajas)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Clave de Licencia
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                      TAFF-2026-PRO-9842
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Vigencia
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      Suscripción Activa
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Versión del Sistema */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem' }}>
                  Versión del Sistema
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 320px)',
                    gap: '1rem'
                  }}
                >
                  <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Versión de la App
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      Coffee´s Pos v2.0.0
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      Compilación: 2026.09 (Estable)
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Datos de la Terminal Vinculada */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem' }}>
                  Datos del Establecimiento
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Establecimiento / Cafetería:</span>
                    <strong style={{ color: '#0f172a' }}>{account?.businessName || 'Cafetería'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Nombre de esta Terminal:</span>
                    <strong style={{ color: '#0f172a' }}>{account?.terminalName || 'Caja Principal'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Cuenta Administradora:</span>
                    <strong style={{ color: '#0f172a' }}>{account?.email || 'admin@coffeespos.com'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Administrador en Sesión:</span>
                    <strong style={{ color: '#0f172a' }}>{currentEmployee?.name} (ID: #{currentEmployee?.id})</strong>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Zona de Administración Avanzada (Desvincular / Cerrar Sesión) */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #fecaca',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                    Zona de Administración Crítica
                  </h2>
                </div>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.84rem', color: '#64748b' }}>
                  Estas acciones modifican la asignación de este equipo o finalizan la sesión del administrador.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {onUnlinkAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            '¿Estás seguro de que deseas desvincular esta terminal de ' +
                              (account?.businessName || 'este establecimiento') +
                              '? Se requerirá configurar la terminal nuevamente.'
                          )
                        ) {
                          onUnlinkAccount();
                        }
                      }}
                      style={{
                        padding: '0.75rem 1.4rem',
                        borderRadius: '10px',
                        border: '1px solid #f87171',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
                    >
                      Desvincular Terminal
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      style={{
                        padding: '0.75rem 1.4rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
                    >
                      Cerrar Sesión de Administrador
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
