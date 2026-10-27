// ==========================================================================
// Coffee´s Pos - Gestión de Empleados en Frontend
// Almacenamiento local desacoplado de backend o bases de datos remotas
// ==========================================================================

import { hashEmployeePin, verifyEmployeePin, isHashed } from '../utils/crypto.js';

const STORAGE_EMPLOYEES_KEY = 'coffees_employees_local';
const LEGACY_STORAGE_EMPLOYEES_KEY = 'taffy_employees_local';

export const DEFAULT_EMPLOYEES = [
  {
    id: '1',
    name: 'Administrador',
    role: 'Administrador',
    pin: '1234',
    avatar: 'AD',
    color: '#0f172a',
    isAdmin: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Cajero Demo',
    role: 'Cajero',
    pin: '0000',
    avatar: 'CD',
    color: '#2563eb',
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '101',
    name: 'Cajero Turno',
    role: 'Cajero',
    pin: '1234',
    avatar: 'CT',
    color: '#059669',
    isAdmin: false,
    createdAt: new Date().toISOString()
  }
];

export function getEmployees() {
  try {
    const raw = localStorage.getItem(STORAGE_EMPLOYEES_KEY) || localStorage.getItem(LEGACY_STORAGE_EMPLOYEES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
      localStorage.setItem(LEGACY_STORAGE_EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
      return [...DEFAULT_EMPLOYEES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_EMPLOYEES];
  } catch {
    return [...DEFAULT_EMPLOYEES];
  }
}

export function saveEmployees(list) {
  try {
    const sanitized = Array.isArray(list) ? list : [];
    localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(sanitized));
    localStorage.setItem(LEGACY_STORAGE_EMPLOYEES_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent('coffees:employees_updated', { detail: sanitized }));
    window.dispatchEvent(new CustomEvent('taffy:employees_updated', { detail: sanitized }));
  } catch (e) {
    console.error('Error guardando empleados:', e);
  }
}

export const EMPLOYEES = getEmployees();

export function addEmployee({ id, name, role, pin, isAdmin }) {
  const cleanId = String(id || '').trim();
  const cleanName = String(name || '').trim();
  const cleanRole = String(role || 'Cajero').trim();
  const cleanPin = String(pin || '').trim();

  if (!cleanId) {
    return { success: false, message: 'El número de empleado es obligatorio.' };
  }
  if (!cleanName) {
    return { success: false, message: 'El nombre del empleado es obligatorio.' };
  }
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, message: 'El PIN debe contener al menos 4 dígitos.' };
  }

  const list = getEmployees();
  if (list.some((e) => String(e.id).trim() === cleanId)) {
    return { success: false, message: `El número de usuario ${cleanId} ya está registrado.` };
  }

  const roleLower = cleanRole.toLowerCase();
  const adminFlag = Boolean(
    isAdmin === true || roleLower.includes('admin') || roleLower.includes('gerente')
  );

  const initials =
    cleanName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join('') || 'EM';

  const newEmployee = {
    id: cleanId,
    name: cleanName,
    role: cleanRole,
    pin: cleanPin,
    avatar: initials,
    color: adminFlag ? '#0f172a' : '#2563eb',
    isAdmin: adminFlag,
    createdAt: new Date().toISOString()
  };

  list.push(newEmployee);
  saveEmployees(list);
  return { success: true, employee: newEmployee };
}

export function updateEmployee(id, updatedFields) {
  const cleanId = String(id || '').trim();
  const list = getEmployees();
  const index = list.findIndex((e) => String(e.id).trim() === cleanId);

  if (index === -1) {
    return { success: false, message: 'Empleado no encontrado.' };
  }

  if (updatedFields.name) {
    list[index].name = String(updatedFields.name).trim();
  }
  if (updatedFields.role) {
    list[index].role = String(updatedFields.role).trim();
  }
  if (updatedFields.pin && updatedFields.pin !== '••••' && updatedFields.pin.length >= 4) {
    list[index].pin = String(updatedFields.pin).trim();
  }
  if (updatedFields.isAdmin !== undefined) {
    list[index].isAdmin = Boolean(updatedFields.isAdmin);
  }

  saveEmployees(list);
  return { success: true, employee: list[index] };
}

export function deleteEmployee(id) {
  const cleanId = String(id || '').trim();
  const list = getEmployees();
  const filtered = list.filter((e) => String(e.id).trim() !== cleanId);

  if (filtered.length === list.length) {
    return { success: false, message: 'Empleado no encontrado.' };
  }

  saveEmployees(filtered);
  return { success: true };
}

export function isEmployeeAdmin(employee) {
  if (!employee) return false;
  return Boolean(
    employee.isAdmin === true ||
    String(employee.role || '').toLowerCase().includes('admin') ||
    String(employee.role || '').toLowerCase().includes('gerente')
  );
}

export function getAdminById(employeeId) {
  const cleanId = String(employeeId).trim();
  const emp = findEmployee(cleanId);
  return emp && isEmployeeAdmin(emp) ? emp : null;
}

export function verifyEmployeeCredentials(employee, pinInput) {
  if (!employee || !pinInput) return false;
  const input = String(pinInput).trim();
  const stored = String(employee.pin || '').trim();

  // Verificación directa en texto plano (modo frontend rápido)
  if (stored === input) return true;

  // Verificación con hash si aplica
  if (isHashed(stored)) {
    return (
      verifyEmployeePin(input, stored, 'coffees_pos', employee.id) ||
      verifyEmployeePin(input, stored, 'taffy', employee.id)
    );
  }

  return false;
}

export function validateAdminCredentials(employeeId, pin) {
  const cleanId = String(employeeId).trim();
  const cleanPin = String(pin).trim();

  const emp = findEmployee(cleanId);
  if (!emp) {
    return { success: false, reason: 'notFound', message: 'Número de empleado no encontrado' };
  }

  if (!isEmployeeAdmin(emp)) {
    return { success: false, reason: 'notAdmin', message: 'El usuario no tiene permisos de administrador' };
  }

  if (!verifyEmployeeCredentials(emp, cleanPin)) {
    return { success: false, reason: 'invalidPin', message: 'PIN de seguridad incorrecto' };
  }

  return { success: true, admin: emp };
}

export function findEmployee(id) {
  const cleanId = String(id).trim();
  const list = getEmployees();
  return list.find((e) => String(e.id).trim() === cleanId) || null;
}

// Sincronización simulada para compatibilidad de frontend
export async function syncEmployeesFromCloud() {
  return getEmployees();
}

