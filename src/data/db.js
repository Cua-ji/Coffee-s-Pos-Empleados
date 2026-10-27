// ==========================================================================
// Taffy POS - Capa de Datos de Frontend (Almacenamiento Local en Memoria/LocalStorage)
// Totalmente desacoplada de backend y bases de datos externas
// ==========================================================================

const STORAGE_ORDERS_KEY = 'taffy_orders_local';

// Pedidos iniciales de demostración para visualización inmediata en Historial y Cortes
const INITIAL_DEMO_ORDERS = [
  {
    id: 'ord_demo_1001',
    ticketNumber: 1001,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
    cashierId: '1',
    cashierName: 'Administrador',
    orderType: 'dine-in',
    tableOrCustomer: 'Mesa 4',
    items: [
      { id: 'p1', name: 'Chilaquiles Verdes con Pollo', price: 135.0, qty: 1, note: 'Sin cebolla' },
      { id: 'p12', name: 'Café Americano Especial', price: 42.0, qty: 2, note: '' }
    ],
    itemCount: 3,
    subtotal: 219.0,
    discountPercent: 0,
    discountAmount: 0,
    tax: 35.04,
    tipPercent: 10,
    tipAmount: 21.9,
    total: 275.94,
    paymentMethod: 'card',
    cashReceived: 275.94,
    changeDue: 0,
    status: 'completed'
  },
  {
    id: 'ord_demo_1002',
    ticketNumber: 1002,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
    cashierId: '2',
    cashierName: 'Cajero Demo',
    orderType: 'takeout',
    tableOrCustomer: 'Carlos Méndez',
    items: [
      { id: 'p8', name: 'Hamburguesa Taffy Smash', price: 165.0, qty: 1, note: 'Término medio' },
      { id: 'p5', name: 'Papas Rústicas a la Francesa', price: 75.0, qty: 1, note: '' },
      { id: 'p16', name: 'Limonada Mineral de Frutos', price: 55.0, qty: 1, note: 'Poco hielo' }
    ],
    itemCount: 3,
    subtotal: 295.0,
    discountPercent: 5,
    discountAmount: 14.75,
    tax: 44.84,
    tipPercent: 15,
    tipAmount: 42.04,
    total: 367.13,
    paymentMethod: 'cash',
    cashReceived: 400.0,
    changeDue: 32.87,
    status: 'completed'
  },
  {
    id: 'ord_demo_1003',
    ticketNumber: 1003,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    cashierId: '1',
    cashierName: 'Administrador',
    orderType: 'dine-in',
    tableOrCustomer: 'Barra 2',
    items: [
      { id: 'p13', name: 'Cappuccino Artesanal Italiano', price: 55.0, qty: 2, note: 'Leche de avena' },
      { id: 'p20', name: 'Croissant Artesanal de Almendras', price: 65.0, qty: 1, note: '' }
    ],
    itemCount: 3,
    subtotal: 175.0,
    discountPercent: 0,
    discountAmount: 0,
    tax: 28.0,
    tipPercent: 10,
    tipAmount: 17.5,
    total: 220.5,
    paymentMethod: 'transfer',
    cashReceived: 220.5,
    changeDue: 0,
    status: 'completed'
  }
];

// Inicialización de la capa de datos local
export function initDB() {
  return new Promise((resolve) => {
    try {
      const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      }
    } catch (err) {
      console.warn('Almacenamiento local:', err);
    }
    resolve(true);
  });
}

// Obtener todas las órdenes registradas
export async function getAllOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      return [...INITIAL_DEMO_ORDERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...INITIAL_DEMO_ORDERS];
  } catch {
    return [...INITIAL_DEMO_ORDERS];
  }
}

// Guardar nueva orden en memoria local
export async function saveOrder(order) {
  const currentOrders = await getAllOrders();
  const normalized = {
    ...order,
    id: order.id || `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: order.createdAt || order.timestamp || new Date().toISOString(),
    timestamp: order.timestamp || order.createdAt || new Date().toISOString(),
    status: order.status || 'completed'
  };

  const existingIndex = currentOrders.findIndex((o) => o.id === normalized.id);
  if (existingIndex >= 0) {
    currentOrders[existingIndex] = normalized;
  } else {
    currentOrders.unshift(normalized);
  }

  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(currentOrders));
  } catch (e) {
    console.warn('Error guardando orden en local:', e);
  }

  window.dispatchEvent(new CustomEvent('taffy:orders_updated', { detail: normalized }));
  return normalized;
}

// Actualizar estatus de una orden
export async function updateOrderStatus(orderId, newStatus) {
  const orders = await getAllOrders();
  const target = orders.find((o) => o.id === orderId);
  if (target) {
    target.status = newStatus;
    if (newStatus === 'completed' && !target.completedAt) {
      target.completedAt = new Date().toISOString();
    }
    return await saveOrder(target);
  }
  return null;
}

// Eliminar orden
export async function deleteOrder(orderId) {
  const orders = await getAllOrders();
  const filtered = orders.filter((o) => o.id !== orderId);
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(filtered));
  } catch {}
  window.dispatchEvent(new CustomEvent('taffy:orders_updated'));
  return true;
}

// Resumen de corte de caja diario
export async function getDailySummary() {
  const orders = await getAllOrders();
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = orders.filter((o) => {
    const orderDate = (o.createdAt || o.timestamp || '').split('T')[0];
    return orderDate === today && o.status !== 'cancelled';
  });

  let totalSales = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalTransfer = 0;
  let totalTips = 0;
  let dineInCount = 0;
  let takeoutCount = 0;

  const employeeMap = {};

  todayOrders.forEach((o) => {
    const orderTotal = Number(o.total || 0);
    const orderTip = Number(o.tip ?? o.tipAmount ?? 0);
    totalTips += orderTip;

    if (o.status === 'completed') {
      totalSales += orderTotal;
      if (o.paymentMethod === 'cash') totalCash += orderTotal;
      else if (o.paymentMethod === 'card') totalCard += orderTotal;
      else if (o.paymentMethod === 'transfer') totalTransfer += orderTotal;
      else totalCash += orderTotal;

      const empId = String(o.employeeId || o.cashierId || '1');
      const empName = o.employeeName || o.cashierName || 'Empleado';

      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          id: empId,
          name: empName,
          ordersCount: 0,
          totalSales: 0,
          cashSales: 0,
          cardSales: 0,
          transferSales: 0
        };
      }

      employeeMap[empId].ordersCount += 1;
      employeeMap[empId].totalSales += orderTotal;
      if (o.paymentMethod === 'cash') employeeMap[empId].cashSales += orderTotal;
      else if (o.paymentMethod === 'card') employeeMap[empId].cardSales += orderTotal;
      else if (o.paymentMethod === 'transfer') employeeMap[empId].transferSales += orderTotal;
      else employeeMap[empId].cashSales += orderTotal;
    }

    if (o.orderType === 'dine-in') dineInCount++;
    else takeoutCount++;
  });

  const completedOrders = todayOrders.filter((o) => o.status === 'completed');
  const employeeSalesList = Object.values(employeeMap).map((e) => ({
    ...e,
    averageTicket: e.ordersCount > 0 ? e.totalSales / e.ordersCount : 0
  }));

  employeeSalesList.sort((a, b) => b.totalSales - a.totalSales);

  return {
    date: today,
    ordersCount: todayOrders.length,
    completedCount: completedOrders.length,
    totalSales,
    totalCash,
    totalCard,
    totalTransfer,
    totalTips,
    dineInCount,
    takeoutCount,
    avgTicket: completedOrders.length ? totalSales / completedOrders.length : 0,
    employeeSales: employeeSalesList,
    todayOrders: completedOrders
  };
}

// Exportar respaldo JSON
export async function exportBackupJSON() {
  const orders = await getAllOrders();
  const backup = {
    app: 'Taffy POS Frontend',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    totalOrders: orders.length,
    orders
  };
  return JSON.stringify(backup, null, 2);
}

// Importar respaldo JSON
export async function importBackupJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.orders)) {
      for (const ord of data.orders) {
        await saveOrder(ord);
      }
      return { success: true, count: data.orders.length };
    }
    return { success: false, message: 'Formato de archivo inválido' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Limpiar todas las órdenes locales
export function clearAllOrders() {
  try {
    localStorage.removeItem(STORAGE_ORDERS_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('taffy:orders_updated'));
}
