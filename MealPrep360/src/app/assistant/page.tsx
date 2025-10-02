'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { Button } from '../components/ui/button';

export default function AssistantPage() {
	const [message, setMessage] = useState('');
	const [chat, setChat] = useState<
		Array<{ role: 'user' | 'assistant'; content: string }>
	>([]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim()) return;

		setChat((prev) => [...prev, { role: 'user', content: message }]);
		setMessage('');

		// Simulate AI response
		setTimeout(() => {
			setChat((prev) => [
				...prev,
				{
					role: 'assistant',
					content:
						'I can help you plan meals, suggest recipes based on your ingredients, and manage your freezer inventory. What would you like to know?',
				},
			]);
		}, 1000);
	};

	return (
		<div className='container mx-auto py-8'>
			<h1 className='text-3xl font-bold mb-6'>AI Assistant</h1>
			<Card className='mb-6'>
				<CardHeader>
					<Typography
						variant='h6'
						component='h2'
					>
						Chat with your AI Assistant
					</Typography>
				</CardHeader>
				<CardContent>
					<div className='space-y-4 mb-4'>
						{chat.map((msg, index) => (
							<div
								key={index}
								className={`p-4 rounded-lg ${
									msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
								}`}
							>
								<p className='font-semibold'>
									{msg.role === 'user' ? 'You' : 'Assistant'}
								</p>
								<p>{msg.content}</p>
							</div>
						))}
					</div>
					<form
						onSubmit={handleSubmit}
						className='flex gap-2'
					>
						<input
							type='text'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							className='flex-1 p-2 border rounded'
							placeholder='Ask me anything about recipes, meal planning, or your freezer...'
						/>
						<Button type='submit'>Send</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
