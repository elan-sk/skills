import React from 'react';
import ReactDOM from 'react-dom/client';
import SearchModal from './SearchModal';

/**
 * Inicializa el modal de búsqueda
 * Se activa desde cualquier elemento con data-search-trigger
 */
const initSearchModal = () => {
  // Crear contenedor para el modal si no existe
  let modalContainer = document.getElementById('search-modal-root');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'search-modal-root';
    document.body.appendChild(modalContainer);
  }

  // Estado global del modal
  let isModalOpen = false;
  let root = null;

  // Función para renderizar el modal
  const renderModal = (open) => {
    isModalOpen = open;

    if (!root) {
      root = ReactDOM.createRoot(modalContainer);
    }

    root.render(
      React.createElement(SearchModal, {
        isOpen: isModalOpen,
        onClose: () => renderModal(false)
      })
    );
  };

  // Escuchar clicks en elementos con data-search-trigger
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-search-trigger]');
    if (trigger) {
      e.preventDefault();
      renderModal(true);
    }
  });

  // También escuchar el ID específico (backward compatibility)
  const searchButton = document.getElementById('search-modal-trigger');
  if (searchButton) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      renderModal(true);
    });
  }

  // Atajo de teclado opcional (Ctrl+K o Cmd+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      renderModal(true);
    }
  });

  // Exponer funciones globales
  window.openSearchModal = () => renderModal(true);
  window.closeSearchModal = () => renderModal(false);

  // Inicializar el modal cerrado
  renderModal(false);
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchModal);
} else {
  initSearchModal();
}

// Exportar función de inicialización
export default initSearchModal;
