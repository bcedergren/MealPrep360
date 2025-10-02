import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		// Read the HTML file
		const htmlPath = join(process.cwd(), 'public', 'status.html');
		const html = readFileSync(htmlPath, 'utf8');

		// Set proper headers
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

		res.status(200).send(html);
	} catch (error) {
		console.error('Error serving status page:', error);

		// Fallback simple status page
		const fallbackHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Shopping List Service</title>
				<style>
					body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
					.container { max-width: 600px; margin: 0 auto; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>🛒 Shopping List Service</h1>
					<p>Service is running but status page could not be loaded.</p>
					<p><a href="/api/health">Check Health</a></p>
					<p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
				</div>
			</body>
			</html>
		`;

		res.setHeader('Content-Type', 'text/html');
		res.status(200).send(fallbackHtml);
	}
}
