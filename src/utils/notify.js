// Sistema de Notificaciones y Confirmaciones In-App para Taffy POS
// Reemplaza window.alert y window.confirm por componentes visuales nativos touch-friendly

export function showToast(message, type = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('taffy:toast', {
        detail: { message, type }
      })
    );
  }
}

export function showConfirm({
  title = 'Confirmación',
  message = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  isDestructive = false,
  onConfirm
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('taffy:confirm', {
        detail: {
          title,
          message,
          confirmText,
          cancelText,
          isDestructive,
          onConfirm
        }
      })
    );
  }
}
