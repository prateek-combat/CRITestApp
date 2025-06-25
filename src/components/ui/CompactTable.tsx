import React from 'react';

interface CompactTableProps {
  children: React.ReactNode;
  className?: string;
}

export const CompactTable: React.FC<CompactTableProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}
    >
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  );
};

interface CompactTableHeaderProps {
  children: React.ReactNode;
}

export const CompactTableHeader: React.FC<CompactTableHeaderProps> = ({
  children,
}) => {
  return (
    <thead className="bg-gray-50">
      <tr>{children}</tr>
    </thead>
  );
};

interface CompactTableBodyProps {
  children: React.ReactNode;
}

export const CompactTableBody: React.FC<CompactTableBodyProps> = ({
  children,
}) => {
  return (
    <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>
  );
};

interface CompactTableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const CompactTableRow: React.FC<CompactTableRowProps> = ({
  children,
  onClick,
  className = '',
}) => {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

interface CompactTableCellProps {
  children: React.ReactNode;
  header?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const CompactTableCell: React.FC<CompactTableCellProps> = ({
  children,
  header = false,
  className = '',
  align = 'left',
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (header) {
    return (
      <th
        className={`px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 ${alignClasses[align]} ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <td className={`px-4 py-3 text-sm ${alignClasses[align]} ${className}`}>
      {children}
    </td>
  );
};

// Compact empty state component
interface CompactEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const CompactEmptyState: React.FC<CompactEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="py-8 text-center">
      <div className="mb-3 flex justify-center text-gray-400">{icon}</div>
      <h3 className="mb-1 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mb-3 text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};
