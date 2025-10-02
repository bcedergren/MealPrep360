import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

// Mock Material-UI Button
jest.mock('@mui/material', () => ({
	Button: ({ children, onClick, disabled, variant, ...props }: any) => (
		<button
			onClick={onClick}
			disabled={disabled}
			data-variant={variant}
			{...props}
		>
			{children}
		</button>
	),
}));

describe('Button Component', () => {
	it('should render button with children', () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole('button', { name: /click me/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent('Click me');
	});

	it('should handle click events', async () => {
		const user = userEvent.setup();
		const handleClick = jest.fn();

		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole('button', { name: /click me/i });
		await user.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('should be disabled when disabled prop is true', () => {
		render(<Button disabled>Disabled Button</Button>);

		const button = screen.getByRole('button', { name: /disabled button/i });
		expect(button).toBeDisabled();
	});

	it('should pass through Material-UI props', () => {
		render(
			<Button
				variant='contained'
				color='primary'
			>
				Primary Button
			</Button>
		);

		const button = screen.getByRole('button', { name: /primary button/i });
		expect(button).toHaveAttribute('data-variant', 'contained');
	});

	it('should render with custom className', () => {
		render(<Button className='custom-class'>Custom Button</Button>);

		const button = screen.getByRole('button', { name: /custom button/i });
		expect(button).toHaveClass('custom-class');
	});

	it('should handle different button types', () => {
		render(<Button type='submit'>Submit Button</Button>);

		const button = screen.getByRole('button', { name: /submit button/i });
		expect(button).toHaveAttribute('type', 'submit');
	});
});
