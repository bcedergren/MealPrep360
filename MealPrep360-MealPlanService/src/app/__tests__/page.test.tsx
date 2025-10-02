import { render } from '@testing-library/react';
import Home from '../page';

// Mock the fetch function
global.fetch = jest.fn();

describe('Home Page', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.API_TOKEN = 'test-token';
		process.env.NEXT_PUBLIC_API_URL = 'http://test-api';
	});

	it('should render service status when API call is successful', async () => {
		const mockStatus = {
			status: 'healthy',
			timestamp: '2024-03-20T12:00:00Z',
			services: {
				database: {
					status: 'connected',
					error: null,
					collections: {
						mealPlans: {
							count: 5,
						},
					},
				},
			},
		};

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockStatus),
		});

		const { container } = render(await Home());
		expect(container.textContent).toContain('"status":"healthy"');
		expect(container.textContent).toContain('"count":5');
	});

	it('should render error message when API call fails', async () => {
		const errorMessage = 'Failed to fetch service status';
		(global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

		const { container } = render(await Home());
		expect(container.textContent).toContain(
			'"error":"Failed to fetch service status"'
		);
	});

	it('should render error message when API token is not set', async () => {
		delete process.env.API_TOKEN;

		const { container } = render(await Home());
		expect(container.textContent).toContain(
			'"error":"API_TOKEN environment variable is not set"'
		);
	});

	it('should use default API URL when NEXT_PUBLIC_API_URL is not set', async () => {
		delete process.env.NEXT_PUBLIC_API_URL;
		const mockStatus = { status: 'healthy' };

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockStatus),
		});

		await Home();
		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:3000/api/health',
			expect.any(Object)
		);
	});
});
