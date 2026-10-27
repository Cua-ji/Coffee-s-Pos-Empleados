import React, { useState, useEffect } from 'react';
import * as db from '../data/db.js';
import { getEmployees } from '../data/employees.js';
import { showToast } from '../utils/notify.js';

export default function ShiftWorkspace({ cashierName }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    setLoading(true);
    try {
      const data = await db.getDailySummary();
      setSummary(data);
    } catch (err) {
      console.error('Error cargando corte:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportJson() {
    try {
      const json = await db.exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corte_caja_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Error al exportar: ' + err.message, 'error');
    }
  }

  function handlePrintShift() {
    window.print();
  }

  if (loading) {
    return (
      <div className="pos-workspace-view active" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Calculando corte de caja del día...
      </div>
    );
  }

  const s = {
    totalSales: Number(summary?.totalSales || 0),
    totalOrders: Number(summary?.ordersCount ?? summary?.totalOrders ?? 0),
    completedCount: Number(summary?.completedCount ?? 0),
    averageTicket: Number(summary?.avgTicket ?? summary?.averageTicket ?? 0),
    cashSales: Number(summary?.totalCash ?? summary?.cashSales ?? 0),
    cardSales: Number(summary?.totalCard ?? summary?.cardSales ?? 0),
    transferSales: Number(summary?.totalTransfer ?? summary?.transferSales ?? 0),
    totalTips: Number(summary?.totalTips || 0),
    dineInOrders: Number(summary?.dineInCount ?? summary?.dineInOrders ?? 0),
    takeoutOrders: Number(summary?.takeoutCount ?? summary?.takeoutOrders ?? 0)
  };

  // Combinar lista oficial de todos los empleados con sus ventas del día
  const allEmployees = getEmployees();
  const salesByEmp = summary?.employeeSales || [];

  const employeeReportList = allEmployees.map((emp) => {
    const saleData = salesByEmp.find(
      (s) => String(s.id).trim() === String(emp.id).trim() || s.name === emp.name
    );
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      ordersCount: saleData?.ordersCount || 0,
      totalSales: saleData?.totalSales || 0,
      cashSales: saleData?.cashSales || 0,
      cardSales: saleData?.cardSales || 0,
      transferSales: saleData?.transferSales || 0,
      averageTicket: saleData?.averageTicket || 0
    };
  });

  // Ordenar de mayor a menor por total de ventas
  employeeReportList.sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div className="pos-workspace-view active" style={{ flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Corte de Caja Diario
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Fecha: {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &bull; Consulta gerencial
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadSummary}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              color: '#0f172a'
            }}
          >
            Exportar Respaldo
          </button>
          <button
            type="button"
            onClick={handlePrintShift}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Bloque 1: Total de Dinero y Métricas del Día */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem' }}>
          Total de Dinero del Día
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0f172a', color: '#ffffff', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Total de Dinero Cobrado</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>
              ${s.totalSales.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              {s.completedCount} tickets cerrados hoy
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Efectivo en Caja</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#059669', marginTop: '0.25rem' }}>
              ${s.cashSales.toFixed(2)}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Ventas con Tarjeta</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#2563eb', marginTop: '0.25rem' }}>
              ${s.cardSales.toFixed(2)}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Transferencias</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#7c3aed', marginTop: '0.25rem' }}>
              ${s.transferSales.toFixed(2)}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Ticket Promedio</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>
              ${s.averageTicket.toFixed(2)}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Propinas Recaudadas</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#d97706', marginTop: '0.25rem' }}>
              ${s.totalTips.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 2: Ventas del Día de Todos los Empleados */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Ventas del Día de Todos los Empleados
            </h3>
            <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Desglose individual de ventas por personal en turno
            </p>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.9rem 1.25rem' }}>Número</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Empleado</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Cargo</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>Órdenes</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Efectivo</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Tarjeta</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Transferencia</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Total Vendido</th>
              </tr>
            </thead>
            <tbody>
              {employeeReportList.map((emp) => {
                const percentOfTotal = s.totalSales > 0 ? ((emp.totalSales / s.totalSales) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                      {emp.id}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#1e293b' }}>
                      {emp.name}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#64748b' }}>
                      {emp.role}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                      {emp.ordersCount}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#059669', fontWeight: 600 }}>
                      ${emp.cashSales.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#2563eb', fontWeight: 600 }}>
                      ${emp.cardSales.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#7c3aed', fontWeight: 600 }}>
                      ${emp.transferSales.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                        ${emp.totalSales.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {percentOfTotal}% del total
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloque 3: Distribución del Servicio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a' }}>
            Distribución por Tipo de Servicio
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Comer Aquí</span>
              <strong>{s.dineInOrders} órdenes</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>Para Llevar</span>
              <strong>{s.takeoutOrders} órdenes</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
