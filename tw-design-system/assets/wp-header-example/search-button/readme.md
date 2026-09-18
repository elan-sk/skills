# Sistema de Búsqueda para WordPress - Archivos Completos

## 📁 Estructura de Archivos

```
js/
├── components/
│   └── search-button/
│       ├── index.js
│       ├── SearchModal.jsx
│       ├── SearchInput.jsx
│       ├── SearchResults.jsx
│       ├── PostCard.jsx
│       ├── EmptyStates.jsx
│       ├── Icons.jsx
│       └── utils/
│           ├── searchAlgorithm.js
│           └── useSearchPosts.js
└── index.js (modificar)
```

---

## 📄 `js/components/search-button/index.js`

```javascript
// js/components/search-button/index.js
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
```

---

## 📄 `js/components/search-button/Icons.jsx`

```jsx
// js/components/search-button/Icons.jsx
import React from 'react';

export const SearchIcon = ({ className = "size-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const XIcon = ({ className = "size-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const LoaderIcon = ({ className = "size-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
```

---

## 📄 `js/components/search-button/utils/searchAlgorithm.js`

```javascript
// js/components/search-button/utils/searchAlgorithm.js

/**
 * Calcula la similitud entre dos strings usando distancia de Levenshtein
 * @param {string} str1 - Primera cadena
 * @param {string} str2 - Segunda cadena
 * @returns {number} - Valor entre 0 y 1 (1 = idénticos)
 */
export const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Si una contiene a la otra, son muy similares
  if (s1.includes(s2) || s2.includes(s1)) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = (s1, s2) => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

/**
 * Busca posts que coincidan con la query, incluso con errores de tipado
 * @param {Array} posts - Array de posts de WordPress
 * @param {string} query - Término de búsqueda
 * @returns {Array} - Posts ordenados por relevancia
 */
export const searchPosts = (posts, query) => {
  if (!query.trim()) return [];

  // Dividir query en palabras (ignorar palabras muy cortas)
  const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);

  const results = posts.map(post => {
    let score = 0;
    const title = post.title.rendered.toLowerCase();
    const content = post.excerpt.rendered.replace(/<[^>]*>/g, '').toLowerCase();
    const fullText = `${title} ${content}`;

    queryWords.forEach(word => {
      // Búsqueda exacta en título (mayor peso)
      if (title.includes(word)) {
        score += 10;
      }

      // Búsqueda exacta en contenido (peso medio)
      if (content.includes(word)) {
        score += 5;
      }

      // Búsqueda por similitud en palabras individuales
      const words = fullText.split(/\s+/);
      words.forEach(w => {
        const similarity = calculateSimilarity(word, w);
        // Solo considerar palabras con similitud alta (>70%)
        if (similarity > 0.7) {
          score += similarity * 3;
        }
      });
    });

    return { ...post, score };
  });

  // Filtrar posts sin puntuación y ordenar por relevancia
  return results
    .filter(post => post.score > 0)
    .sort((a, b) => b.score - a.score);
};
```

---

## 📄 `js/components/search-button/utils/useSearchPosts.js`

```javascript
// js/components/search-button/utils/useSearchPosts.js
import { useState, useEffect, useRef } from 'react';
import { searchPosts } from './searchAlgorithm';

/**
 * Hook para manejar la búsqueda de posts con delay
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {number} searchDelay - Delay en ms antes de buscar (default: 300)
 * @returns {Object} - Estado y funciones de búsqueda
 */
export const useSearchPosts = (isOpen, searchDelay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Cargar todos los posts al abrir el modal
  useEffect(() => {
    if (isOpen && posts.length === 0) {
      setIsLoading(true);
      fetch('/wp-json/wp/v2/posts?per_page=100&_embed')
        .then(res => res.json())
        .then(data => {
          setPosts(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error loading posts:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen, posts.length]);

  // Búsqueda con delay
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        const results = searchPosts(posts, searchTerm);
        setFilteredPosts(results);
        setIsSearching(false);
      }, searchDelay);
    } else {
      setFilteredPosts([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, posts, searchDelay]);

  return {
    searchTerm,
    setSearchTerm,
    filteredPosts,
    isLoading,
    isSearching,
  };
};
```

---

## 📄 `js/components/search-button/PostCard.jsx`

```jsx
// js/components/search-button/PostCard.jsx
import React from 'react';

/**
 * Card individual de un post en los resultados
 */
const PostCard = ({ post }) => {
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const excerpt = post.excerpt.rendered
    .replace(/<[^>]*>/g, '')
    .substring(0, 150);

  return (
    <a
      href={post.link}
      className="flex gap-4 p-4 rounded-lg hover:bg-background transition-colors group"
    >
      {/* Imagen destacada */}
      {featuredImage && (
        <div className="flex-shrink-0 w-px-120 h-px-80 rounded-lg overflow-hidden bg-outline">
          <img
            src={featuredImage}
            alt={post.title.rendered}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Contenido del post */}
      <div className="flex-container justify-center">
        <h3 className="text-large text-primary mb-2 group-hover:text-primary-dk transition-colors line-clamp-2">
          {post.title.rendered}
        </h3>
        <p className="text-small text-secondary line-clamp-2">
          {excerpt}...
        </p>
      </div>
    </a>
  );
};

export default PostCard;
```

---

## 📄 `js/components/search-button/EmptyStates.jsx`

```jsx
// js/components/search-button/EmptyStates.jsx
import React from 'react';
import { SearchIcon, LoaderIcon } from './Icons';

/**
 * Estado de carga inicial
 */
export const LoadingState = () => (
  <div className="flex-center py-16">
    <LoaderIcon className="size-12 text-primary animate-spin" />
  </div>
);

/**
 * Estado inicial (sin búsqueda)
 */
export const InitialState = () => (
  <div className="flex-center py-16 text-center">
    <div>
      <SearchIcon className="size-16 text-secondary mx-auto mb-4" />
      <p className="text-large text-secondary">
        Escribe para comenzar a buscar
      </p>
    </div>
  </div>
);

/**
 * Estado sin resultados
 */
export const NoResultsState = () => (
  <div className="flex-center py-16 text-center">
    <div>
      <p className="text-large text-secondary mb-2">
        No se encontraron resultados
      </p>
      <p className="text-base text-secondary/70">
        Intenta con otros términos de búsqueda
      </p>
    </div>
  </div>
);
```

---

## 📄 `js/components/search-button/SearchInput.jsx`

```jsx
// js/components/search-button/SearchInput.jsx
import React, { useRef, useEffect } from 'react';
import { SearchIcon, LoaderIcon } from './Icons';

/**
 * Input de búsqueda con icono y loader
 */
const SearchInput = ({ value, onChange, isSearching, autoFocus = true }) => {
  const inputRef = useRef(null);

  // Auto-focus cuando se especifica
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-secondary" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe para buscar..."
        className="w-full pl-12 pr-4 py-3 text-base border-3 border-outline rounded-lg
                 focus:border-primary focus:outline-none transition-colors"
      />
      {isSearching && (
        <LoaderIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-secondary animate-spin" />
      )}
    </div>
  );
};

export default SearchInput;
```

---

## 📄 `js/components/search-button/SearchResults.jsx`

```jsx
// js/components/search-button/SearchResults.jsx
import React from 'react';
import PostCard from './PostCard';
import { LoadingState, InitialState, NoResultsState } from './EmptyStates';

/**
 * Contenedor de resultados con estados
 */
const SearchResults = ({
  isLoading,
  isSearching,
  searchTerm,
  filteredPosts
}) => {
  // Estado: Cargando posts iniciales
  if (isLoading) {
    return <LoadingState />;
  }

  // Estado: Sin búsqueda aún
  if (!searchTerm.trim()) {
    return <InitialState />;
  }

  // Estado: Sin resultados
  if (filteredPosts.length === 0 && !isSearching) {
    return <NoResultsState />;
  }

  // Estado: Mostrando resultados
  return (
    <div className="flex-container gap-y-4">
      {filteredPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default SearchResults;
```

---

## 📄 `js/components/search-button/SearchModal.jsx`

```jsx
// js/components/search-button/SearchModal.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons';
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';
import { useSearchPosts } from './utils/useSearchPosts';

/**
 * Modal principal de búsqueda
 */
const SearchModal = ({ isOpen, onClose }) => {
  const {
    searchTerm,
    setSearchTerm,
    filteredPosts,
    isLoading,
    isSearching,
  } = useSearchPosts(isOpen);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="position-full bg-primary-dk/95 z-[9999] flex-center"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg w-[90%] max-w-px-800 max-h-[90vh] flex-container relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-px-24 pb-px-16 border-b-3 border-outline">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 text-primary">Buscar Entradas</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-outline rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <XIcon className="size-6" />
            </button>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            isSearching={isSearching}
          />
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto scroll-bar-decorated p-px-24">
          <SearchResults
            isLoading={isLoading}
            isSearching={isSearching}
            searchTerm={searchTerm}
            filteredPosts={filteredPosts}
          />
        </div>

        {/* Footer con contador */}
        {searchTerm.trim() && filteredPosts.length > 0 && (
          <div className="p-px-16 border-t-3 border-outline">
            <p className="text-small text-secondary text-center">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SearchModal;
```

---

## 📄 `js/index.js` (Modificar)

```javascript
// js/index.js
import './libraries/test';
import './components/element-test';
import './components/swiper-test';

// ⭐ Importar el sistema de búsqueda
import './components/search-button';
```

---

## 📄 Ejemplo de uso en `header.php`

```php
<!-- header.php -->
<header class="bg-primary">
  <div class="container">
    <nav class="flex items-center justify-between h-px-80">

      <!-- Logo -->
      <a href="<?php echo home_url(); ?>" class="flex items-center gap-2">
        <img src="<?php echo get_template_directory_uri(); ?>/assets/images/logo.svg"
             alt="Logo" class="h-px-40">
      </a>

      <!-- Menú y búsqueda -->
      <div class="flex items-center gap-6">
        <?php
        wp_nav_menu(array(
          'theme_location' => 'primary',
          'container' => false,
          'menu_class' => 'flex gap-4'
        ));
        ?>

        <!-- Botón de búsqueda - CUALQUIER DISEÑO -->
        <button
          data-search-trigger
          class="btn-primary"
          aria-label="Buscar en el sitio"
        >
          <span class="flex items-center gap-2">
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="hidden md:inline">Buscar</span>
          </span>
        </button>
      </div>

    </nav>
  </div>
</header>
```

---

## 📦 Instalación

1. **Instalar dependencias:**
```bash
npm install react react-dom
npm install -D @vitejs/plugin-react
```

2. **Actualizar `vite.config.js`:**
```javascript
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./",
  base: "",
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "js/index.js"),
      },
      output: {
        entryFileNames: "js/theme.js",
        assetFileNames: ({ name }) => {
          if (name && name.endsWith(".css")) return "css/[name][extname]";
          return "[name][extname]";
        },
      },
    },
  },
});
```

3. **Compilar:**
```bash
npm run build
```

---

## 🎯 Características

✅ Búsqueda inteligente con algoritmo de similitud
✅ Búsqueda en tiempo real con delay optimizado
✅ Modal responsive con tu sistema Tailwind
✅ Múltiples formas de activación (data-attribute, ID, atajo de teclado)
✅ Código modular y fácil de mantener
✅ Estados vacíos y de carga bien manejados
✅ Accesibilidad incluida (ESC para cerrar, focus management)

---

## 🔧 Personalización

- **Cambiar delay de búsqueda:** Edita `searchDelay` en `useSearchPosts.js`
- **Ajustar sensibilidad:** Modifica `similarity > 0.7` en `searchAlgorithm.js`
- **Cambiar número de posts:** Ajusta `per_page=100` en `useSearchPosts.js`
- **Personalizar diseño:** Edita las clases Tailwind en cada componente

---

## ⌨️ Atajos de Teclado

- **Ctrl + K** (Windows/Linux) o **Cmd + K** (Mac): Abrir búsqueda
- **ESC**: Cerrar modal
- **Clic fuera del modal**: Cerrar modal

---

## 📞 API JavaScript

```javascript
// Abrir modal desde JavaScript
window.openSearchModal();

// Cerrar modal desde JavaScript
window.closeSearchModal();
```
