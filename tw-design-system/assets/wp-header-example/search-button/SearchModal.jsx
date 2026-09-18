import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons';
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';
import { useSearchPosts } from './utils/useSearchPosts';


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
            if (e.key === 'Escape' && isOpen) { onClose() }
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
            className="position-full bg-primary/95 z-[9999] flex-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-lg w-[90%] max-w-px-700 max-h-[80vh] min-h-[60vh] flex-container relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-px-24 pb-px-16 border-b-3 border-outline">
                    <div className="flex items-center justify-between">
                        <h2 className="text-h3 text-primary mb-0">Buscar Entradas</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-error hover:text-white cursor-pointer rounded-lg transition-all duration-300"
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
                <div className="flex-1 overflow-y-auto scroll-bar-decorated p-px-24 relative">
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
                        <p className="text-small text-secondary-dk text-center">
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
