import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export const usePagination = <T>(
  data: T[],
  options: UsePaginationOptions = {}
) => {
  const { initialPage = 1, initialPageSize = 10 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    // Ajustar página atual se necessário
    const newTotalPages = Math.ceil(totalItems / newPageSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, totalItems]);

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  const getPaginationInfo = useMemo(() => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    return {
      startItem,
      endItem,
      totalItems,
      currentPage,
      totalPages,
      pageSize
    };
  }, [currentPage, pageSize, totalItems, totalPages]);

  const getPageNumbers = useMemo(() => {
    const delta = 2; // Número de páginas para mostrar de cada lado da página atual
    const range = [];
    const rangeWithDots = [];

    // Calcular o range de páginas a mostrar
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Adicionar primeira página
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    // Adicionar range do meio
    rangeWithDots.push(...range);

    // Adicionar última página
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => 
      // Remover duplicatas (caso a primeira ou última página já esteja no range)
      arr.indexOf(item) === index
    );
  }, [currentPage, totalPages]);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;
  const isEmpty = data.length === 0;

  return {
    // Data
    paginatedData,
    
    // Estado
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    
    // Info
    paginationInfo: getPaginationInfo,
    pageNumbers: getPageNumbers,
    
    // Flags
    canGoNext,
    canGoPrevious,
    isEmpty,
    
    // Actions
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    resetPagination
  };
}; 