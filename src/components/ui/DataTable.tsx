'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
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

interface TableHeaderProps {
  children: ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return (
    <thead className="bg-ink/5">
      <tr>{children}</tr>
    </thead>
  );
};

interface TableHeaderCellProps {
  children: ReactNode;
  className?: string;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  children,
  className = '',
}) => {
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-ink/50 ${className}`}
    >
      {children}
    </th>
  );
};

interface TableBodyProps {
  children: ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children }) => {
  return (
    <tbody className="divide-y divide-ink/10 bg-parchment/80">{children}</tbody>
  );
};

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <motion.tr
      className={`transition-colors hover:bg-ink/5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      whileHover={{ backgroundColor: 'rgba(20, 24, 30, 0.04)' }}
    >
      {children}
    </motion.tr>
  );
};

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
}) => {
  return (
    <td className={`px-3 py-2 text-sm text-ink ${className}`}>{children}</td>
  );
};

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <tr>
      <td colSpan={100} className="px-3 py-8 text-center">
        {icon && <div className="mb-2 flex justify-center">{icon}</div>}
        <p className="text-sm text-ink/50">{message}</p>
      </td>
    </tr>
  );
};
