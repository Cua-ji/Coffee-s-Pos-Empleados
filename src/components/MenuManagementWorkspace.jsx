import React, { useState, useEffect, useMemo } from 'react';
import {
  getMenuCategories,
  getMenuProducts,
  addProduct,
  updateProduct,
  deleteProduct
} from '../data/menuData.js';
import { showToast, showConfirm } from '../utils/notify.js';

export default function MenuManagementWorkspace() {
  const [categories] = useState(getMenuCategories);
  const [products, setProducts] = useState(getMenuProducts);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  // Estado del modal de alta / edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('platillos');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSku, setFormSku] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    function handleUpdate() {
      setProducts(getMenuProducts());
    }
    window.addEventListener('coffees:menu_updated', handleUpdate);
    window.addEventListener('taffy:menu_updated', handleUpdate);
    return () => {
      window.removeEventListener('coffees:menu_updated', handleUpdate);
      window.removeEventListener('taffy:menu_updated', handleUpdate);
    };
  }, []);

  function resetForm() {
    setFormName('');
    setFormCategory('platillos');
    setFormPrice('');
    setFormDesc('');
    setFormSku('');
    setEditingProduct(null);
    setErrorMessage('');
  }

  function handleOpenCreate() {
    resetForm();
    setIsModalOpen(true);
    setSuccessMessage('');
  }

  function handleOpenEdit(prod) {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.categoryId || prod.category || 'platillos');
    setFormPrice(String(prod.price));
    setFormDesc(prod.desc || '');
    setFormSku(prod.sku || '');
    setIsModalOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function handleSave(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (editingProduct) {
      const res = updateProduct(editingProduct.id, {
        name: formName,
        categoryId: formCategory,
        price: parseFloat(formPrice),
        desc: formDesc,
        sku: formSku
      });
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setProducts(getMenuProducts());
      setIsModalOpen(false);
      resetForm();
      setSuccessMessage('Producto actualizado exitosamente.');
    } else {
      const res = addProduct({
        name: formName,
        categoryId: formCategory,
        price: parseFloat(formPrice),
        desc: formDesc,
        sku: formSku
      });
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setProducts(getMenuProducts());
      setIsModalOpen(false);
      resetForm();
      setSuccessMessage('Producto agregado al menú.');
    }
  }

  function handleDelete(prod) {
    showConfirm({
      title: 'Eliminar Producto',
      message: `¿Confirmas que deseas eliminar el producto "${prod.name}" del menú?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        const res = deleteProduct(prod.id);
        if (!res.success) {
          showToast(res.message, 'error');
          return;
        }
        setProducts(getMenuProducts());
        showToast(`Producto "${prod.name}" eliminado del menú.`, 'success');
      }
    });
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCat === 'all' ||
        p.categoryId === selectedCat ||
        p.category === selectedCat;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.desc && p.desc.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  return (
    <div className="pos-workspace-view active" style={{ padding: '1.5rem', overflowY: 'auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Editar Menú
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Administración del catálogo de productos y precios &bull; {products.length} productos activos
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
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
          + Agregar Producto
        </button>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div style={{ padding: '0.75rem 1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
          {successMessage}
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCat(c.id)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: selectedCat === c.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: selectedCat === c.id ? '#0f172a' : '#ffffff',
                color: selectedCat === c.id ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar producto o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.55rem 1rem',
            border: '1px solid #cbd5e1',
            borderRadius: '9999px',
            fontSize: '0.88rem',
            minWidth: '220px'
          }}
        />
      </div>

      {/* Modal / Panel de Alta y Edición */}
      {isModalOpen && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            {editingProduct ? `Editar Producto: ${editingProduct.name}` : 'Añadir Nuevo Producto al Menú'}
          </h3>

          {errorMessage && (
            <div style={{ padding: '0.6rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Nombre del Producto
              </label>
              <input
                type="text"
                placeholder="Ej. Café Americano Doble"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Categoría
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', background: '#ffffff', boxSizing: 'border-box' }}
              >
                {categories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Precio ($ MXN)
              </label>
              <input
                type="number"
                step="0.50"
                min="0.50"
                placeholder="Ej. 65.00"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Código / SKU (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. CAF-05"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Descripción de Ingredientes / Preparación (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Extracto de café de grano fresco con agua caliente purificada"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
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
                {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Productos */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '0.9rem 1.25rem' }}>Código</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Producto</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Categoría</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Descripción</th>
              <th style={{ padding: '0.9rem 1.25rem' }}>Precio</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron productos con el filtro seleccionado.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const categoryObj = categories.find(c => c.id === (p.categoryId || p.category));
                const catName = categoryObj?.name || p.categoryId || 'General';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                      {p.sku || '-'}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        {catName}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#64748b', fontSize: '0.84rem', maxWidth: '280px' }}>
                      {p.desc || '-'}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      ${Number(p.price || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
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
                          onClick={() => handleDelete(p)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: '#fff1f2',
                            border: '1px solid #fecdd3',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#be123c'
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
