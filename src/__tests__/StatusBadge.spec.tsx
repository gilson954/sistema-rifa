import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBadge } from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders Pending with yellow border', () => {
    render(<StatusBadge status="pending" />);
    const el = screen.getByRole('status', { name: /pendente/i });
    expect(el).toBeInTheDocument();
    expect(el).toHaveStyle({ borderColor: '#F59E0B', color: '#B45309' });
  });

  it('renders Approved with green border', () => {
    render(<StatusBadge status="approved" />);
    const el = screen.getByRole('status', { name: /aprovado/i });
    expect(el).toHaveStyle({ borderColor: '#22C55E', color: '#15803D' });
  });

  it('renders Rejected with red border', () => {
    render(<StatusBadge status="rejected" />);
    const el = screen.getByRole('status', { name: /rejeitado/i });
    expect(el).toHaveStyle({ borderColor: '#EF4444', color: '#B91C1C' });
  });

  it('renders Expired with gray border', () => {
    render(<StatusBadge status="expired" />);
    const el = screen.getByRole('status', { name: /expirado/i });
    expect(el).toHaveStyle({ borderColor: '#9CA3AF', color: '#374151' });
  });
});

