// ==========================================================================
// Gestor de Tenant / Cuenta para Taffy POS
// Aísla estrictamente los datos (empleados, menú, ventas) por cuenta registrada
// ==========================================================================

import { hashAccountPassword, verifyAccountPassword, isHashed } from './crypto.js';

const ACCOUNT_KEY = 'taffy_account';
const ACCOUNTS_REGISTRY_KEY = 'taffy_accounts_registry';

export function getCurrentAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentTenantId() {
  const account = getCurrentAccount();
  if (!account) return null;
  const rawId = account.tenantId || account.email || account.id || '';
  const clean = String(rawId).trim().toLowerCase();
  return clean || null;
}

export function getCurrentAuthToken() {
  const account = getCurrentAccount();
  return account?.token || null;
}

/**
 * Verifica que un registro (empleado, producto, pedido) pertenezca estrictamente
 * al usuario (Tenant) que tiene la sesión activa.
 */
export function belongsToCurrentTenant(item, explicitTenantId = null) {
  const activeTenant = explicitTenantId || getCurrentTenantId();
  if (!activeTenant) return false;
  if (!item || typeof item !== 'object') return false;

  const itemTenant = String(item.tenantId || item.tenant_id || '').trim().toLowerCase();
  // Si el registro tiene tenantId, debe coincidir exactamente con el tenant activo
  if (itemTenant) {
    return itemTenant === activeTenant;
  }
  return true;
}

/**
 * Guarda una cuenta en el registro local de tenants con contraseña hasheada
 * (nunca en texto plano) para permitir validación segura también en modo offline.
 */
export function saveTenantInLocalRegistry(accountData, plainOrHashedPassword) {
  try {
    const tenantId = String(accountData?.tenantId || accountData?.email || '').trim().toLowerCase();
    if (!tenantId) return;

    const rawRegistry = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    const registry = rawRegistry ? JSON.parse(rawRegistry) : {};

    const passwordHash = plainOrHashedPassword
      ? (isHashed(plainOrHashedPassword)
          ? plainOrHashedPassword
          : hashAccountPassword(plainOrHashedPassword, tenantId))
      : registry[tenantId]?.passwordHash || '';

    registry[tenantId] = {
      id: accountData.id || `tenant_${tenantId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      tenantId,
      ownerName: accountData.ownerName || 'Propietario',
      businessName: accountData.businessName || 'Mi Cafetería',
      email: tenantId,
      terminalName: accountData.terminalName || 'Caja Principal',
      licenseKey: accountData.licenseKey || 'TAFFY-DEMO-2026',
      adminEmployeeId: accountData.adminEmployeeId || '101',
      passwordHash,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn('No se pudo actualizar el registro local de cuentas:', err);
  }
}

/**
 * Verifica las credenciales de una cuenta localmente (respaldo cuando está offline)
 */
export function verifyLocalTenantCredentials(email, passwordInput) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !passwordInput) {
      return { success: false, message: 'Ingresa tu correo y contraseña.' };
    }

    const rawRegistry = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    const registry = rawRegistry ? JSON.parse(rawRegistry) : {};
    const record = registry[cleanEmail];

    if (!record) {
      return {
        success: false,
        notFoundLocally: true,
        message: 'No se encontró una cuenta registrada con ese correo en este servidor/equipo.'
      };
    }

    if (record.passwordHash && !verifyAccountPassword(passwordInput, record.passwordHash, cleanEmail)) {
      return {
        success: false,
        message: 'Contraseña incorrecta. Verifica tus credenciales.'
      };
    }

    const { passwordHash, ...safeAccount } = record;
    return { success: true, account: safeAccount };
  } catch {
    return { success: false, message: 'Error al validar credenciales de la cuenta.' };
  }
}

// ==========================================================================
// Cuenta de Pruebas Predeterminada (Inicia sesión directa en el POS)
// ==========================================================================
export const DEFAULT_TEST_ACCOUNT = {
  id: 'tenant_admin_taffypos_com',
  tenantId: 'admin@taffypos.com',
  ownerName: 'Admin Pruebas',
  businessName: 'Cafetería Taffy',
  email: 'admin@taffypos.com',
  terminalName: 'Caja Principal',
  licenseKey: 'TAFFY-DEMO-2026',
  adminEmployeeId: '1',
  configuredAt: '2026-10-24T00:00:00.000Z'
};

export const DEFAULT_TEST_EMPLOYEES = [
  {
    id: '1',
    tenantId: 'admin@taffypos.com',
    name: 'Administrador',
    role: 'Administrador',
    pin: '$taffy$v1$1524175862f2e77c720f7013$1dccb6065a39357fb5f1a76343c928159360cecbe59fce1b9ed89ebca718da6e',
    avatar: 'AD',
    color: '#0f172a',
    isAdmin: true,
    createdAt: '2026-10-24T00:00:00.000Z'
  },
  {
    id: '2',
    tenantId: 'admin@taffypos.com',
    name: 'Cajero Demo',
    role: 'Cajero',
    pin: '$taffy$v1$69606b8e6824b6912cf7fafa$d39a44466f2c98f4bfd6da99f54d6a6c0f6aa049c99a240d12ab50c0e1965324',
    avatar: 'CD',
    color: '#2563eb',
    isAdmin: false,
    createdAt: '2026-10-24T00:00:00.000Z'
  }
];

export function initDefaultTestState() {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(DEFAULT_TEST_ACCOUNT));
    localStorage.setItem('taffy_employees_admin@taffypos.com', JSON.stringify(DEFAULT_TEST_EMPLOYEES));
    localStorage.setItem('taffy_current_employee', JSON.stringify(DEFAULT_TEST_EMPLOYEES[0]));
    saveTenantInLocalRegistry(DEFAULT_TEST_ACCOUNT, 'admin');
    return {
      account: DEFAULT_TEST_ACCOUNT,
      employee: DEFAULT_TEST_EMPLOYEES[0]
    };
  } catch (err) {
    console.warn('Error inicializando cuenta de pruebas:', err);
    return { account: DEFAULT_TEST_ACCOUNT, employee: DEFAULT_TEST_EMPLOYEES[0] };
  }
}

