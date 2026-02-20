interface InvoiceStatusBadgeProps {
  status: string;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusConfig = {
    PAID: {
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      icon: '✓',
      label: 'Paid'
    },
    UNPAID: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
      icon: '⏳',
      label: 'Unpaid'
    },
    OVERDUE: {
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      icon: '⚠',
      label: 'Overdue'
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNPAID;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
