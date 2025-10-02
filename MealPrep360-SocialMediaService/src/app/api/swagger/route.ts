import { createSwaggerSpec } from 'next-swagger-doc';

export async function GET() {
	const spec = createSwaggerSpec({
		apiFolder: './src/app/api',
		definition: {
			openapi: '3.0.0',
			info: {
				title: 'MealPrep360 Social API',
				version: '1.0.0',
			},
		},
	});
	return new Response(JSON.stringify(spec), {
		headers: { 'Content-Type': 'application/json' },
	});
}
