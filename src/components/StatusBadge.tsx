import React from 'react';
import { motion } from 'framer-motion';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

const STATUS_STYLES: Record<PaymentStatus, { color: string; borderColor: string; shadow: string }> = {
  pending: { color: '#B45309', borderColor: '#F59E0B', shadow: '0 0 12px rgba(245, 158, 11, 0.25)' },
  approved: { color: '#15803D', borderColor: '#22C55E', shadow: '0 0 12px rgba(34, 197, 94, 0.25)' },
  rejected: { color: '#B91C1C', borderColor: '#EF4444', shadow: '0 0 12px rgba(239, 68, 68, 0.25)' },
  expired: { color: '#374151', borderColor: '#9CA3AF', shadow: '0 0 12px rgba(156, 163, 175, 0.25)' },
};

export interface StatusBadgeProps {
  status: PaymentStatus;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '', onClick }) => {
  const styles = STATUS_STYLES[status];
  return (
    <motion.span
      role="status"
      aria-label={label || status}
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-xs font-semibold bg-transparent border ${className}`}
      style={{ color: styles.color, borderColor: styles.borderColor, borderWidth: 1 }}
      whileHover={{ scale: 1.05, boxShadow: styles.shadow }}
      transition={{ duration: 0.3 }}
    >
      {label ||
        (status === 'pending'
          ? 'Pendente'
          : status === 'approved'
          ? 'Aprovado'
          : status === 'rejected'
          ? 'Rejeitado'
          : 'Expirado')}
    </motion.span>
  );
};

