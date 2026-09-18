// js/components/search-button/utils/useSearchPosts.js
import { useState, useEffect, useRef } from 'react';
import { searchPosts } from './searchAlgorithm';

/**
 * Hook para manejar la búsqueda de posts con delay
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {number} searchDelay - Delay en ms antes de buscar (default: 300)
 * @param {number} maxResults - Número máximo de resultados (default: 10)
 * @returns {Object} - Estado y funciones de búsqueda
 */
export const useSearchPosts = (isOpen, searchDelay = 300, maxResults = 10) => {
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
        const results = searchPosts(posts, searchTerm, maxResults);
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
  }, [searchTerm, posts, searchDelay, maxResults]);

  return {
    searchTerm,
    setSearchTerm,
    filteredPosts,
    isLoading,
    isSearching,
  };
};
