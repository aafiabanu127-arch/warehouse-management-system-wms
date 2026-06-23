import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductFormModal from './ProductFormModal';
const mockCategories = [
  { id: 1, name: 'Electronics', description: 'Gadgets' },
  { id: 2, name: 'Furniture', description: 'Tables and chairs' },
];

describe('ProductFormModal', () => {

  it('renders "Add Product" heading and loads category options', async () => {
    render(<ProductFormModal product={null} categories={mockCategories} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Add Product')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Furniture')).toBeInTheDocument();
    });
  });

  it('renders "Edit Product" heading and pre-fills fields when editing', async () => {
    const existing = {
      id: 5, name: 'Laptop', sku: 'LAP001', description: 'Dell Laptop',
      unit_volume: 1.5, unit_weight: 2.0, unit_price: 999.99, category: 1,
    };
    render(<ProductFormModal product={existing} categories={mockCategories} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument();
    expect(screen.getByDisplayValue('LAP001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1.5')).toBeInTheDocument();

    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('shows an error if the category field is left blank and form submission is forced', async () => {
    const { container } = render(<ProductFormModal product={null} categories={mockCategories} onClose={vi.fn()} onSubmit={vi.fn()} />);
    

    await userEvent.type(screen.getByLabelText('Name'), 'New Item');
    await userEvent.type(screen.getByLabelText('SKU'), 'NI001');

    // Bypass native HTML5 required validation to test the component's own
    // category check, mirroring a browser where required validation is disabled.
    const form = container.querySelector('form') as HTMLFormElement;
    form.noValidate = true;
    await userEvent.click(screen.getByText('Save'));

    expect(screen.getByText('Please select a category.')).toBeInTheDocument();
  });

  it('submits complete, correctly-typed data when all fields are filled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProductFormModal product={null} categories={mockCategories} onClose={vi.fn()} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Desk Lamp');
    await userEvent.type(screen.getByLabelText('SKU'), 'DL001');
    await userEvent.selectOptions(screen.getByLabelText('Category'), '1');
    await userEvent.clear(screen.getByLabelText('Unit Volume'));
    await userEvent.type(screen.getByLabelText('Unit Volume'), '0.5');
    await userEvent.clear(screen.getByLabelText('Unit Weight'));
    await userEvent.type(screen.getByLabelText('Unit Weight'), '1.2');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Desk Lamp',
        sku: 'DL001',
        description: '',
        unit_volume: 0.5,
        unit_weight: 1.2,
        unit_price: 0,
        category: 1,
      });
    });
  });

  it('shows a SKU-specific error message if onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('duplicate'));
    render(<ProductFormModal product={null} categories={mockCategories} onClose={vi.fn()} onSubmit={onSubmit} />);
    

    await userEvent.type(screen.getByLabelText('Name'), 'Dup Item');
    await userEvent.type(screen.getByLabelText('SKU'), 'DUP01');
    await userEvent.selectOptions(screen.getByLabelText('Category'), '1');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save product. Check that the SKU is unique.')).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<ProductFormModal product={null} categories={mockCategories} onClose={onClose} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});