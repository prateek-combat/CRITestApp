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
      className={`overflow-hidden rounded-lg border border-ink/10 bg-parchment/80 ${className}`}
    >
      <table className="min-w-full divide-y divide-ink/10">{children}</table>
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
    <thead className="bg-ink/5">
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
    <tbody className="divide-y divide-ink/10 bg-parchment/80">{children}</tbody>
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
      className={`hover:bg-ink/5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
        className={`px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink/50 ${alignClasses[align]} ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      className={`px-4 py-3 text-sm text-ink ${alignClasses[align]} ${className}`}
    >
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
      <div className="mb-3 flex justify-center text-ink/40">{icon}</div>
      <h3 className="mb-1 text-sm font-medium text-ink">{title}</h3>
      {description && <p className="mb-3 text-sm text-ink/50">{description}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};
