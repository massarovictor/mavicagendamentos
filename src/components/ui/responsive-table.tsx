import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  mobileLabel?: string;
  hiddenOnMobile?: boolean;
  sortable?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  getItemId?: (item: T) => string | number;
}

export function ResponsiveTable<T>({
  data,
  columns,
  mobileCardRender,
  onRowClick,
  loading,
  emptyState,
  className,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId
}: ResponsiveTableProps<T>) {
  const [expandedCards, setExpandedCards] = React.useState<Set<string | number>>(new Set());

  const toggleCardExpansion = (itemId: string | number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedCards(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? data : []);
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!onSelectionChange || !getItemId) return;
    
    const itemId = getItemId(item);
    const newSelection = checked 
      ? [...selectedItems, item]
      : selectedItems.filter(selected => getItemId(selected) !== itemId);
    
    onSelectionChange(newSelection);
  };

  const isSelected = (item: T): boolean => {
    if (!getItemId) return false;
    const itemId = getItemId(item);
    return selectedItems.some(selected => getItemId(selected) === itemId);
  };

  // Renderização desktop (tabela normal)
  const DesktopTable = () => (
    <div className="hidden md:block overflow-x-auto">
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.length === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const itemId = getItemId ? getItemId(item) : index;
            return (
              <TableRow
                key={itemId}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer",
                  isSelected(item) && "bg-blue-50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected(item)}
                      onChange={(e) => handleSelectItem(item, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Renderização mobile (cards)
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {data.map((item, index) => {
        const itemId = getItemId ? getItemId(item) : index;
        const isExpanded = expandedCards.has(itemId);
        
        // Se há um render customizado para mobile, usa ele
        if (mobileCardRender) {
          return (
            <Card 
              key={itemId} 
              className={cn(
                "hover:shadow-md transition-shadow",
                isSelected(item) && "ring-2 ring-blue-500"
              )}
            >
              <CardContent className="p-4">
                {selectable && (
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected(item)}
                      onChange={(e) => handleSelectItem(item, e.target.checked)}
                      className="rounded border-gray-300 mr-3"
                    />
                    <span className="text-sm text-gray-600">Selecionar</span>
                  </div>
                )}
                {mobileCardRender(item, index)}
              </CardContent>
            </Card>
          );
        }

        // Renderização automática baseada nas colunas
        const visibleColumns = columns.filter(col => !col.hiddenOnMobile);
        const hiddenColumns = columns.filter(col => col.hiddenOnMobile);

        return (
          <Card 
            key={itemId}
            className={cn(
              "hover:shadow-md transition-shadow",
              isSelected(item) && "ring-2 ring-blue-500"
            )}
          >
            <CardContent className="p-4">
              {selectable && (
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={isSelected(item)}
                    onChange={(e) => handleSelectItem(item, e.target.checked)}
                    className="rounded border-gray-300 mr-3"
                  />
                </div>
              )}
              
              {/* Colunas sempre visíveis */}
              <div className="space-y-2">
                {visibleColumns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 pr-3">
                      {column.mobileLabel || column.header}:
                    </span>
                    <div className="text-sm text-gray-900 text-right min-w-0 flex-1">
                      {column.accessor(item)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Colunas expandíveis em mobile */}
              {hiddenColumns.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(itemId)}
                    className="mt-3 p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Menos detalhes
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Mais detalhes
                      </>
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {hiddenColumns.map((column) => (
                        <div key={column.key} className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 pr-3">
                            {column.mobileLabel || column.header}:
                          </span>
                          <div className="text-sm text-gray-900 text-right min-w-0 flex-1">
                            {column.accessor(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Botão de ação se hover é clicável */}
              {onRowClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRowClick(item)}
                  className="mt-3 w-full"
                >
                  Ver Detalhes
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Estado vazio
  if (data.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        {emptyState || (
          <div className="text-gray-500">
            <p className="font-medium">Nenhum item encontrado</p>
            <p className="text-sm">Tente ajustar os filtros</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <DesktopTable />
      <MobileCards />
    </div>
  );
}

// Hook para simplificar o uso
export const useResponsiveTable = <T,>() => {
  const [selectedItems, setSelectedItems] = React.useState<T[]>([]);
  
  const clearSelection = () => setSelectedItems([]);
  const selectAll = (items: T[]) => setSelectedItems(items);
  const hasSelection = selectedItems.length > 0;
  
  return {
    selectedItems,
    setSelectedItems,
    clearSelection,
    selectAll,
    hasSelection
  };
}; 