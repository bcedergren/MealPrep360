import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
	try {
		const { title, content } = await req.json();
		if (!title && !content) {
			return NextResponse.json(
				{ error: 'Missing title or content' },
				{ status: 400 }
			);
		}

		const prompt = `Suggest 5-10 relevant, short, comma-separated tags for the following blog post. Only return the tags, nothing else.\n\nTitle: ${title}\nContent: ${content}`;

		const openaiRes = await fetch(
			'https://api.openai.com/v1/chat/completions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content:
								'You are a helpful assistant that generates relevant tags for blog posts.',
						},
						{ role: 'user', content: prompt },
					],
					max_tokens: 64,
					temperature: 0.4,
				}),
			}
		);

		if (!openaiRes.ok) {
			const error = await openaiRes.text();
			return NextResponse.json({ error }, { status: 500 });
		}

		const data = await openaiRes.json();
		const text = data.choices?.[0]?.message?.content || '';
		// Split by comma, trim, and filter out empty tags
		const tags = text
			.split(',')
			.map((t: string) => t.trim())
			.filter((t: string) => t.length > 0);

		return NextResponse.json({ tags });
	} catch (err) {
		return NextResponse.json(
			{ error: 'Failed to generate tags' },
			{ status: 500 }
		);
	}
}
