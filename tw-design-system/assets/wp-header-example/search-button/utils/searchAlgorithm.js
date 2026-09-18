// js/components/search-button/utils/searchAlgorithm.js
import Fuse from 'fuse.js';

/**
 * Normaliza texto removiendo tildes
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Busca posts usando Fuse.js (fuzzy search profesional)
 * @param {Array} posts - Array de posts de WordPress
 * @param {string} query - Término de búsqueda
 * @param {number} baseMaxResults - Máximo base de resultados (default: 15)
 * @returns {Array} - Posts ordenados por relevancia
 */
export const searchPosts = (posts, query, baseMaxResults = 15) => {
  if (!query.trim()) return [];

  // Calcular límite dinámico basado en longitud de búsqueda
  const queryWords = query.trim().split(' ').filter(w => w.length > 2);
  let maxResults;

  if (queryWords.length === 1) {
    maxResults = baseMaxResults;
  } else if (queryWords.length <= 3) {
    maxResults = Math.floor(baseMaxResults * 0.65);
  } else if (queryWords.length <= 5) {
    maxResults = Math.floor(baseMaxResults * 0.45);
  } else {
    maxResults = Math.floor(baseMaxResults * 0.3);
  }

  // Preparar datos para Fuse (normalizar textos)
  const searchablePosts = posts.map(post => {
    const normalizedTitle = normalizeText(post.title.rendered);
    const normalizedExcerpt = normalizeText(post.excerpt.rendered.replace(/<[^>]*>/g, ''));

    return {
      ...post,
      searchText: `${normalizedTitle} ${normalizedExcerpt}`,  // Campo único combinado
      normalizedTitle,
      normalizedExcerpt
    };
  });

  // Configuración de Fuse.js optimizada
  const fuseOptions = {
    keys: ['searchText'],    // Buscar en texto combinado
    includeScore: true,
    threshold: 0.5,          // Más flexible (0.4 era muy estricto)
    distance: 200,           // Mayor distancia permitida
    minMatchCharLength: 2,   // Palabras más cortas
    ignoreLocation: true,    // No importa la posición
    findAllMatches: true,    // Encontrar todas las coincidencias
    useExtendedSearch: false // Desactivar para mejor rendimiento
  };

  // Crear instancia de Fuse
  const fuse = new Fuse(searchablePosts, fuseOptions);

  // Normalizar query
  const normalizedQuery = normalizeText(query.trim());

  // Realizar búsqueda
  const results = fuse.search(normalizedQuery);

  // Debug (quitar después)
  console.log('Query normalizada:', normalizedQuery);
  console.log('Resultados Fuse:', results.length);
  console.log('Primeros 3 scores:', results.slice(0, 3).map(r => ({
    title: r.item.title.rendered,
    score: r.score
  })));

  // Retornar resultados
  return results
    .slice(0, maxResults)
    .map(result => result.item);
};
