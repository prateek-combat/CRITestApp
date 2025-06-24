import React, { ReactNode } from 'react';

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
  responsive?: boolean; // Whether to apply responsive styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  hover?: boolean; // Whether to apply hover effects
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  align?: 'left' | 'center' | 'right'; // Text alignment
  width?: string; // Column width
}

// Table Component
const Table: React.FC<TableProps> = ({
  children,
  className = '',
  responsive = false,
}) => {
  const baseClasses = 'min-w-full';

  if (responsive) {
    return (
      <div className="responsive-table-container">
        <table className={`responsive-table ${baseClasses} ${className}`}>
          {children}
        </table>
      </div>
    );
  }

  return <table className={`${baseClasses} ${className}`}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = '',
}) => {
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  hover = false,
}) => {
  const hoverClasses = hover
    ? 'hover:bg-gray-50 transition-colors duration-150'
    : '';
  return <tr className={`${hoverClasses} ${className}`}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = '',
  align = 'left',
  width,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const CellTag = isHeader ? 'th' : 'td';

  const style = width ? { width } : undefined;

  return (
    <CellTag className={`${alignClasses[align]} ${className}`} style={style}>
      {children}
    </CellTag>
  );
};

// Enhanced Loading Table Skeleton
const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="responsive-table-container">
    <table className="responsive-table">
      <TableHeader>
        <TableRow hover={false}>
          {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={i} isHeader>
              <div className="h-4 animate-pulse rounded bg-gray-200"></div>
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} hover={false}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <div className="h-4 animate-pulse rounded bg-gray-200"></div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </table>
  </div>
);

// Enhanced Empty State Component
const TableEmptyState: React.FC<{
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ message = 'No data available', icon, action }) => (
  <div className="py-12 text-center">
    {icon && <div className="mx-auto mb-4 h-12 w-12 text-gray-400">{icon}</div>}
    <p className="mb-4 text-sm text-gray-500">{message}</p>
    {action}
  </div>
);

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableSkeleton,
  TableEmptyState,
};
