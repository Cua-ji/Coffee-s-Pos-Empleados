import React, { useState, useEffect } from 'react';
import SetupAccountScreen from './components/SetupAccountScreen.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import EmployeeIdScreen from './components/EmployeeIdScreen.jsx';
import EmployeePinScreen from './components/EmployeePinScreen.jsx';
import PosHeader from './components/PosHeader.jsx';
import OrderingWorkspace from './components/OrderingWorkspace.jsx';
import HistoryWorkspace from './components/HistoryWorkspace.jsx';
import ShiftWorkspace from './components/ShiftWorkspace.jsx';
import MenuManagementWorkspace from './components/MenuManagementWorkspace.jsx';
import UserManagementWorkspace from './components/UserManagementWorkspace.jsx';
import AdminDashboardWorkspace from './components/AdminDashboardWorkspace.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import ReceiptModal from './components/ReceiptModal.jsx';
import NoteModal from './components/NoteModal.jsx';
import MenuModal from './components/MenuModal.jsx';
import AdminAuthModal from './components/AdminAuthModal.jsx';
import ToastNotification from './components/ToastNotification.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';

import * as db from './data/db.js';
import { playHapticSound } from './utils/audio.js';
import { showToast, showConfirm } from './utils/notify.js';
import {
  initDefaultTestState,
  DEFAULT_TEST_ACCOUNT,
  DEFAULT_TEST_EMPLOYEES
} from './utils/tenant.js';

export default function App() {
  // Estado de Cuenta / Multi-Tenant Onboarding (Carga o inicializa cuenta de prueba)
  const [account, setAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('coffees_pos_account') || localStorage.getItem('taffy_account');
      if (saved) return JSON.parse(saved);
      if (
        localStorage.getItem('coffees_unlinked_manual') === 'true' ||
        localStorage.getItem('taffy_unlinked_manual') === 'true'
      ) {
        return null;
      }
      const { account: defaultAcc } = initDefaultTestState();
      return defaultAcc;
    } catch {
      return null;
    }
  });

  // Employee Authentication State (Sesión persistente directa para pruebas)
  const [currentEmployee, setCurrentEmployee] = useState(() => {
    try {
      const saved = localStorage.getItem('coffees_current_employee') || localStorage.getItem('taffy_current_employee');
      if (saved) return JSON.parse(saved);
      if (
        localStorage.getItem('coffees_unlinked_manual') === 'true' ||
        localStorage.getItem('taffy_unlinked_manual') === 'true'
      ) {
        return null;
      }
      return DEFAULT_TEST_EMPLOYEES[0];
    } catch {
      return null;
    }
  });

  // Navigation State (Acceso directo a POS en cuenta de prueba o Setup si fue desvinculada)
  const [activeScreen, setActiveScreen] = useState(() => {
    try {
      const hasAccount = localStorage.getItem('coffees_pos_account') || localStorage.getItem('taffy_account');
      const isUnlinked =
        localStorage.getItem('coffees_unlinked_manual') === 'true' ||
        localStorage.getItem('taffy_unlinked_manual') === 'true';
      if (!hasAccount && isUnlinked) {
        return 'setup';
      }
      const savedEmp = localStorage.getItem('coffees_current_employee') || localStorage.getItem('taffy_current_employee');
      return savedEmp ? 'pos' : 'welcome';
    } catch {
      return 'setup';
    }
  });
  const [activePosTab, setActivePosTab] = useState('order');
  const [adminAuthPendingTab, setAdminAuthPendingTab] = useState(null);

  // Preference Settings
  const [theme, setTheme] = useState(() => localStorage.getItem('coffees_theme') || localStorage.getItem('taffy_theme') || 'theme-nordic');
  const [audioEnabled, setAudioEnabled] = useState(() => (localStorage.getItem('coffees_audio') ?? localStorage.getItem('taffy_audio')) !== 'false');

  // In-App Toast & Confirmation Modal State
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isDestructive: false,
    onConfirm: null
  });

  // Order & Cart State
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'takeout'
  const [tableOrCustomer, setTableOrCustomer] = useState('');
  const [ticketCounter, setTicketCounter] = useState(1001);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);
  const [heldOrders, setHeldOrders] = useState([]);

  // Modals State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [activeOrderReceipt, setActiveOrderReceipt] = useState(null);

  // Initialize DB and fetch next ticket counter on mount
  useEffect(() => {
    db.initDB()
      .then(async () => {
        const all = await db.getAllOrders();
        if (all && all.length > 0) {
          const maxTicket = Math.max(...all.map((o) => Number(o.ticketNumber) || 1000));
          setTicketCounter(maxTicket + 1);
        }
      })
      .catch((err) => console.warn('IndexedDB Init:', err));
  }, []);

  // Listeners for global In-App Toasts and Confirmations
  useEffect(() => {
    function handleToastEvent(e) {
      if (e.detail) {
        setToast(e.detail);
      }
    }

    function handleConfirmEvent(e) {
      if (e.detail) {
        setConfirmModal({
          isOpen: true,
          title: e.detail.title || 'Confirmación',
          message: e.detail.message || '',
          confirmText: e.detail.confirmText || 'Aceptar',
          cancelText: e.detail.cancelText || 'Cancelar',
          isDestructive: Boolean(e.detail.isDestructive),
          onConfirm: () => {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            if (e.detail.onConfirm) {
              e.detail.onConfirm();
            }
          }
        });
      }
    }

    window.addEventListener('coffees:toast', handleToastEvent);
    window.addEventListener('taffy:toast', handleToastEvent);
    window.addEventListener('coffees:confirm', handleConfirmEvent);
    window.addEventListener('taffy:confirm', handleConfirmEvent);
    return () => {
      window.removeEventListener('coffees:toast', handleToastEvent);
      window.removeEventListener('taffy:toast', handleToastEvent);
      window.removeEventListener('coffees:confirm', handleConfirmEvent);
      window.removeEventListener('taffy:confirm', handleConfirmEvent);
    };
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('coffees_theme', theme);
    localStorage.setItem('taffy_theme', theme);
  }, [theme]);

  // Save audio preference
  useEffect(() => {
    localStorage.setItem('coffees_audio', String(audioEnabled));
    localStorage.setItem('taffy_audio', String(audioEnabled));
  }, [audioEnabled]);

  // Account Onboarding handlers
  function handleAccountConfigured(accountData) {
    try {
      localStorage.removeItem('coffees_unlinked_manual');
      localStorage.removeItem('taffy_unlinked_manual');
    } catch {}
    setAccount(accountData);
    localStorage.setItem('coffees_pos_account', JSON.stringify(accountData));
    localStorage.setItem('taffy_account', JSON.stringify(accountData));
    setActiveScreen('welcome');
    showToast(`Terminal vinculada con éxito a ${accountData.businessName || 'tu cafetería'}`, 'success');
  }

  function handleUnlinkAccount() {
    showConfirm({
      title: 'Desvincular Terminal',
      message: '¿Estás seguro de que deseas cerrar la sesión de esta terminal y desvincularla de la cuenta?',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        try {
          localStorage.setItem('coffees_unlinked_manual', 'true');
          localStorage.setItem('taffy_unlinked_manual', 'true');
        } catch {}
        const oldTenant = account?.tenantId || (account?.email ? account.email.toLowerCase().trim() : null);
        if (oldTenant) {
          localStorage.removeItem(`coffees_employees_${oldTenant}`);
          localStorage.removeItem(`taffy_employees_${oldTenant}`);
          localStorage.removeItem(`coffees_menu_products_${oldTenant}`);
          localStorage.removeItem(`taffy_menu_products_${oldTenant}`);
          localStorage.removeItem(`coffees_orders_backup_${oldTenant}`);
          localStorage.removeItem(`taffy_orders_backup_${oldTenant}`);
        }
        localStorage.removeItem('coffees_employees_local');
        localStorage.removeItem('taffy_employees_v1');
        localStorage.removeItem('coffees_menu_products_local');
        localStorage.removeItem('taffy_menu_products_v1');
        localStorage.removeItem('coffees_orders_local');
        localStorage.removeItem('taffy_orders_backup');
        localStorage.removeItem('coffees_pos_account');
        localStorage.removeItem('taffy_account');
        localStorage.removeItem('coffees_current_employee');
        localStorage.removeItem('taffy_current_employee');
        setAccount(null);
        setCurrentEmployee(null);
        setCart([]);
        setTableOrCustomer('');
        setActiveScreen('setup');
        setIsMenuOpen(false);
        showToast('Terminal desvinculada del negocio.', 'info');
      }
    });
  }

  // Flow handlers
  function handleStart() {
    playHapticSound('click', audioEnabled);
    setActiveScreen('employee-id');
  }

  function handleEmployeeIdentified(emp) {
    setCurrentEmployee(emp);
    setActiveScreen('employee-pin');
  }

  function handleLoginSuccess(emp) {
    setCurrentEmployee(emp);
    localStorage.setItem('coffees_current_employee', JSON.stringify(emp));
    localStorage.setItem('taffy_current_employee', JSON.stringify(emp));
    setActiveScreen('pos');
    setActivePosTab('order');
  }

  function handleLogout() {
    playHapticSound('click', audioEnabled);

    function doLogout() {
      localStorage.removeItem('coffees_current_employee');
      localStorage.removeItem('taffy_current_employee');
      setCurrentEmployee(null);
      setCart([]);
      setTableOrCustomer('');
      setActiveScreen('welcome');
      setIsMenuOpen(false);
    }

    if (cart.length > 0) {
      showConfirm({
        title: 'Descartar Orden',
        message: 'Tiene una orden activa en el ticket. ¿Desea salir y descartarla?',
        confirmText: 'Salir y Descartar',
        cancelText: 'Continuar Orden',
        isDestructive: true,
        onConfirm: doLogout
      });
      return;
    }
    doLogout();
  }

  // Hold current order
  function handleHoldOrder() {
    if (cart.length === 0) return;
    playHapticSound('click', audioEnabled);

    const heldItem = {
      ticketNumber: ticketCounter,
      orderType,
      tableOrCustomer,
      cart: [...cart],
      discountPercent,
      tipPercent,
      heldAt: new Date().toISOString()
    };

    setHeldOrders((prev) => [...prev, heldItem]);
    setCart([]);
    setTableOrCustomer('');
    setDiscountPercent(0);
    setTipPercent(0);
    setTicketCounter((prev) => prev + 1);
    showToast(`Orden #${heldItem.ticketNumber} colocada en espera.`, 'info');
  }

  function handleRestoreHeldOrder(index) {
    playHapticSound('click', audioEnabled);
    const target = heldOrders[index];
    if (!target) return;

    if (cart.length > 0) {
      showConfirm({
        title: 'Reemplazar Orden',
        message: 'La orden actual se reemplazará por la orden en espera. ¿Continuar?',
        confirmText: 'Reemplazar',
        cancelText: 'Cancelar',
        onConfirm: () => {
          setOrderType(target.orderType);
          setTableOrCustomer(target.tableOrCustomer);
          setCart(target.cart);
          setDiscountPercent(target.discountPercent || 0);
          setTipPercent(target.tipPercent || 0);
          setHeldOrders((prev) => prev.filter((_, i) => i !== index));
        }
      });
      return;
    }

    setOrderType(target.orderType);
    setTableOrCustomer(target.tableOrCustomer);
    setCart(target.cart);
    setDiscountPercent(target.discountPercent || 0);
    setTipPercent(target.tipPercent || 0);
    setHeldOrders((prev) => prev.filter((_, i) => i !== index));
  }

  // Note Modal
  function handleEditItemNote(index) {
    setEditingItemIndex(index);
    setIsNoteOpen(true);
  }

  function handleSaveItemNote(note) {
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      setCart((prevCart) =>
        prevCart.map((item, idx) =>
          idx === editingItemIndex ? { ...item, note } : item
        )
      );
    }
  }

  // Calculate order totals
  function getOrderTotals() {
    const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = rawSubtotal * (discountPercent / 100);
    const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
    const taxAmount = subtotalAfterDiscount * 0.16;
    const tipAmount = subtotalAfterDiscount * (tipPercent / 100);
    const finalTotal = subtotalAfterDiscount + taxAmount + tipAmount;

    return {
      subtotal: rawSubtotal,
      discountAmount,
      tax: taxAmount,
      tipAmount,
      total: finalTotal
    };
  }

  // Payment Confirmation
  async function handleConfirmPayment({ method, cashReceived, changeDue }) {
    const { subtotal, discountAmount, tax, tipAmount, total } = getOrderTotals();

    const orderRecord = {
      ticketNumber: ticketCounter,
      orderType,
      tableOrCustomer: tableOrCustomer.trim() || (orderType === 'dine-in' ? 'Mostrador' : 'Para Llevar'),
      cashierId: currentEmployee?.id || '101',
      cashierName: currentEmployee?.name || 'Cajero',
      items: [...cart],
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      discountPercent,
      discountAmount,
      tax,
      tipPercent,
      tipAmount,
      total,
      paymentMethod: method,
      cashReceived,
      changeDue,
      timestamp: new Date().toISOString()
    };

    try {
      await db.saveOrder(orderRecord);
    } catch (err) {
      console.warn('Error guardando orden en IndexedDB:', err);
    }

    setIsCheckoutOpen(false);
    setActiveOrderReceipt(orderRecord);
    setIsReceiptOpen(true);
  }

  function handleStartNewOrder() {
    setIsReceiptOpen(false);
    setCart([]);
    setTableOrCustomer('');
    setDiscountPercent(0);
    setTipPercent(0);
    setTicketCounter((prev) => prev + 1);
  }

  function handleReprintOrder(order) {
    setActiveOrderReceipt(order);
    setIsReceiptOpen(true);
  }

  async function handleReprintLastOrder() {
    if (activeOrderReceipt) {
      setIsReceiptOpen(true);
      return;
    }
    try {
      const orders = await db.getAllOrders();
      if (orders && orders.length > 0) {
        const sorted = [...orders].sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
        setActiveOrderReceipt(sorted[0]);
        setIsReceiptOpen(true);
      } else {
        showToast('No hay tickets registrados aún para reimprimir', 'info');
      }
    } catch (err) {
      showToast('No hay tickets disponibles para reimprimir', 'info');
    }
  }

  const currentTotals = getOrderTotals();

  return (
    <div id="app-viewport">
      {/* PANTALLA 0: SETUP / AUTENTICACIÓN INICIAL MULTI-TENANT */}
      {activeScreen === 'setup' && (
        <SetupAccountScreen
          onAccountConfigured={handleAccountConfigured}
          audioEnabled={audioEnabled}
        />
      )}

      {/* PANTALLA 1: BIENVENIDA */}
      {activeScreen === 'welcome' && (
        <WelcomeScreen
          onStart={handleStart}
          onOpenMenu={() => setIsMenuOpen(true)}
          theme={theme}
          businessName={account?.businessName}
        />
      )}

      {/* PANTALLA 2: NÚMERO DE EMPLEADO */}
      {activeScreen === 'employee-id' && (
        <EmployeeIdScreen
          onBack={() => setActiveScreen('welcome')}
          onEmployeeIdentified={handleEmployeeIdentified}
          audioEnabled={audioEnabled}
        />
      )}

      {/* PANTALLA 3: PIN DEL EMPLEADO */}
      {activeScreen === 'employee-pin' && (
        <EmployeePinScreen
          employee={currentEmployee}
          onBack={() => setActiveScreen('employee-id')}
          onLoginSuccess={handleLoginSuccess}
          audioEnabled={audioEnabled}
        />
      )}

      {/* PANTALLA 4: PUNTO DE VENTA (POS) */}
      {activeScreen === 'pos' && (
        <section id="screen-pos" className="screen-view active" aria-label="Punto de Venta Principal">
          {activePosTab !== 'admin-dashboard' && (
            <PosHeader
              activeTab={activePosTab}
              onTabChange={(tab) => {
                playHapticSound('click', audioEnabled);
                setActivePosTab(tab);
              }}
              employee={currentEmployee}
              onLogout={handleLogout}
              audioEnabled={audioEnabled}
              onOpenSettings={() => setIsMenuOpen(true)}
              onReprintLastTicket={handleReprintLastOrder}
              businessName={account?.businessName}
            />
          )}

          {/* VISTA: TOMA DE ÓRDENES Y COBRO RÁPIDO */}
          {activePosTab === 'order' && (
            <OrderingWorkspace
              orderType={orderType}
              setOrderType={setOrderType}
              tableOrCustomer={tableOrCustomer}
              setTableOrCustomer={setTableOrCustomer}
              ticketCounter={ticketCounter}
              cart={cart}
              setCart={setCart}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              tipPercent={tipPercent}
              setTipPercent={setTipPercent}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
              onHoldOrder={handleHoldOrder}
              heldOrders={heldOrders}
              onRestoreHeldOrder={handleRestoreHeldOrder}
              onEditItemNote={handleEditItemNote}
              audioEnabled={audioEnabled}
            />
          )}

          {/* VISTA: DASHBOARD INTEGRAL DE ADMINISTRACIÓN (SOLO GERENCIA) */}
          {activePosTab === 'admin-dashboard' && (
            <AdminDashboardWorkspace
              currentEmployee={currentEmployee}
              account={account}
              onBack={() => setActivePosTab('order')}
              onReprintOrder={handleReprintOrder}
              onLogout={handleLogout}
              onUnlinkAccount={handleUnlinkAccount}
            />
          )}

          {/* VISTAS LEGACY PARA COMPATIBILIDAD DIRECTA */}
          {activePosTab === 'history' && (
            <HistoryWorkspace
              onReprintOrder={handleReprintOrder}
            />
          )}

          {activePosTab === 'shift' && (
            <ShiftWorkspace
              cashierName={currentEmployee?.name}
            />
          )}

          {activePosTab === 'menu-admin' && (
            <MenuManagementWorkspace />
          )}

          {activePosTab === 'users-admin' && (
            <UserManagementWorkspace
              currentEmployee={currentEmployee}
            />
          )}
        </section>
      )}

      {/* MODAL COBRO */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalAmount={currentTotals.total}
        onConfirmPayment={handleConfirmPayment}
        audioEnabled={audioEnabled}
      />

      {/* MODAL TICKET / RECIBO TÉRMICO */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={activeOrderReceipt}
        onStartNewOrder={handleStartNewOrder}
      />

      {/* MODAL NOTAS DE COCINA */}
      <NoteModal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        initialNote={editingItemIndex !== null ? cart[editingItemIndex]?.note : ''}
        onSaveNote={handleSaveItemNote}
      />

      {/* MODAL MENÚ / CONFIGURACIÓN DEL SISTEMA */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        theme={theme}
        setTheme={setTheme}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        account={account}
        onUnlinkAccount={handleUnlinkAccount}
        currentEmployee={currentEmployee}
        onReprintOrder={handleReprintOrder}
        onReprintLastTicket={handleReprintLastOrder}
      />

      {/* MODAL AUTORIZACIÓN GERENCIAL */}
      <AdminAuthModal
        isOpen={Boolean(adminAuthPendingTab)}
        onClose={() => setAdminAuthPendingTab(null)}
        onSuccess={(admin) => {
          if (adminAuthPendingTab) {
            setActivePosTab(adminAuthPendingTab);
            setAdminAuthPendingTab(null);
          }
        }}
        targetTitle={adminAuthPendingTab === 'history' ? 'Historial de pedidos' : 'Corte de turno'}
        audioEnabled={audioEnabled}
      />

      {/* NOTIFICACIONES TOAST IN-APP */}
      <ToastNotification
        toast={toast}
        onDismiss={() => setToast(null)}
      />

      {/* MODAL DE CONFIRMACIÓN IN-APP TOUCH */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
