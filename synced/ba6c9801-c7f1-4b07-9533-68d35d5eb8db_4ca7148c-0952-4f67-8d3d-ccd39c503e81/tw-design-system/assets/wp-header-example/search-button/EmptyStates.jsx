import { SearchIcon, LoaderIcon } from './Icons';

/**
 * Estado de carga inicial
 */
export const LoadingState = () => (
  <div className="flex-center absolute inset-0 mb-4">
    <LoaderIcon className="size-12 text-primary animate-spin" />
  </div>
);

/**
 * Estado inicial (sin búsqueda)
 */
export const InitialState = () => (
  <div className="flex-center absolute inset-0">
    <div>
      <SearchIcon className="size-16 text-secondary-dk mx-auto mb-4" />
      <p className="text-large text-secondary-dk">
        Escribe para comenzar a buscar
      </p>
    </div>
  </div>
);

/**
 * Estado sin resultados
 */
export const NoResultsState = () => (
  <div className="flex-center text-center absolute inset-0">
    <div>
      <p className="text-large text-secondary-dk mb-2">
        No se encontraron resultados
      </p>
      <p className="text-base text-secondary-dk/70">
        Intenta con otros términos de búsqueda
      </p>
    </div>
  </div>
);
