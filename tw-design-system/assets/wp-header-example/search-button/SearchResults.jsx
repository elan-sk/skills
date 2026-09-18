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
