import React, { useState, useEffect } from 'react';
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  updateEmployee,
  isEmployeeAdmin
} from '../data/employees.js';
import { showToast, showConfirm } from '../utils/notify.js';

export default function UserManagementWorkspace({ currentEmployee }) {
  const [employees, setEmployees] = useState(getEmployees);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Formulario de alta / edición
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Cajero');
  const [formId, setFormId] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formIsAdmin, setFormIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    function handleUpdate() {
      setEmployees(getEmployees());
    }
    window.addEventListener('coffees:employees_updated', handleUpdate);
    window.addEventListener('taffy:employees_updated', handleUpdate);
    return () => {
      window.removeEventListener('coffees:employees_updated', handleUpdate);
      window.removeEventListener('taffy:employees_updated', handleUpdate);
    };
  }, []);

  function resetForm() {
    setFormName('');
    setFormRole('Cajero');
    setFormId('');
    setFormPin('');
    setFormIsAdmin(false);
    setEditingEmployee(null);
    setErrorMessage('');
  }

  function handleOpenAdd() {
    resetForm();
    setShowAddForm(true);
    setSuccessMessage('');
  }

  function handleOpenEdit(emp) {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormRole(emp.role);
    setFormId(emp.id);
    setFormPin('••••');
    setFormIsAdmin(isEmployeeAdmin(emp));
    setShowAddForm(true);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function handleSave(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (editingEmployee) {
      // Actualizar empleado existente
      const res = updateEmployee(editingEmployee.id, {
        name: formName,
        role: formRole,
        pin: formPin,
        isAdmin: formIsAdmin
      });
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setEmployees(getEmployees());
      setShowAddForm(false);
      resetForm();
      setSuccessMessage('Usuario actualizado con éxito.');
    } else {
      // Alta de nuevo empleado
      const res = addEmployee({
        id: formId,
        name: formName,
        role: formRole,
        pin: formPin,
        isAdmin: formIsAdmin
      });
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setEmployees(getEmployees());
      setShowAddForm(false);
      resetForm();
      setSuccessMessage('Usuario registrado con éxito.');
    }
  }

  function handleDelete(emp) {
    const currentId = currentEmployee?.id;
    if (String(emp.id).trim() === String(currentId).trim()) {
      showToast('No puedes dar de baja tu propio usuario mientras tienes la sesión iniciada.', 'error');
      return;
    }

    showConfirm({
      title: 'Dar de Baja Usuario',
      message: `¿Confirmas que deseas dar de baja al usuario ${emp.name} (${emp.id})?`,
      confirmText: 'Dar de Baja',
      cancelText: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        const res = deleteEmployee(emp.id, currentId);
        if (!res.success) {
          showToast(res.message, 'error');
          return;
        }
        setEmployees(getEmployees());
        showToast(`Usuario ${emp.name} dado de baja.`, 'success');
      }
    });
  }

  return (
    <div className="pos-workspace-view active" style={{ padding: '1.5rem', overflowY: 'auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Gestión de Usuarios
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Altas y bajas de personal &bull; {employees.length} usuarios registrados
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            padding: '0.65rem 1.35rem',
            background: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          + Dar de Alta Usuario
        </button>
      </div>

      {/* Mensajes de retroalimentación */}
      {successMessage && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
          {successMessage}
        </div>
      )}

      {/* Formulario de Alta / Edición (Inline / Card) */}
      {showAddForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            {editingEmployee ? `Modificar Usuario: ${editingEmployee.name}` : 'Registrar Nuevo Usuario'}
          </h3>

          {errorMessage && (
            <div style={{ padding: '0.6rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Ej. Ana Martínez"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Cargo
              </label>
              <input
                type="text"
                placeholder="Ej. Cajero, Gerente, Encargado..."
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Número de Usuario (Manual)
              </label>
              <input
                type="text"
                placeholder="Ej. 102 o 2676324"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                disabled={Boolean(editingEmployee)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  background: editingEmployee ? '#e2e8f0' : '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                PIN de Acceso (Manual, mín. 4 dígitos)
              </label>
              <input
                type="password"
                placeholder="Ej. 4567"
                maxLength={8}
                value={formPin}
                onChange={(e) => setFormPin(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="chk-is-admin"
                checked={formIsAdmin}
                onChange={(e) => setFormIsAdmin(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="chk-is-admin" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                Otorgar permisos administrativos y gerenciales (Cortes, Menú y Usuarios)
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1.5rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {editingEmployee ? 'Guardar Cambios' : 'Guardar Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '0.9rem 1.25rem' }}>Número de Usuario</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Nombre</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Cargo</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Nivel de Acceso</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>PIN</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const admin = isEmployeeAdmin(emp);
              const isCurrent = String(emp.id).trim() === String(currentEmployee?.id).trim();

              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    {emp.id}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#1e293b' }}>
                    {emp.name}
                    {isCurrent && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        Sesión actual
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: '#475569' }}>
                    {emp.role}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: admin ? '#0f172a' : '#f1f5f9',
                        color: admin ? '#ffffff' : '#475569'
                      }}
                    >
                      {admin ? 'Administrador' : 'Operativo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: '#64748b', letterSpacing: '0.15em' }}>
                    ••••
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(emp)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#334155'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(emp)}
                        disabled={isCurrent}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: isCurrent ? '#f1f5f9' : '#fff1f2',
                          border: isCurrent ? '1px solid #e2e8f0' : '1px solid #fecdd3',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: isCurrent ? 'not-allowed' : 'pointer',
                          color: isCurrent ? '#94a3b8' : '#be123c'
                        }}
                      >
                        Dar de baja
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
