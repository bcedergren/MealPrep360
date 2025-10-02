export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#fafafa',
				color: '#222',
				padding: '32px',
			}}
		>
			<Image
				src='/images/logo.png'
				alt='MealPrep360 Logo'
				width={240}
				height={80}
				style={{ marginBottom: 16 }}
				priority
			/>
			<h1 style={{ fontSize: 32, marginBottom: 8 }}>Page Not Found</h1>
			<p
				style={{
					fontSize: 18,
					marginBottom: 24,
					maxWidth: 400,
					textAlign: 'center',
				}}
			>
				Sorry, we couldn’t find the page you’re looking for.
				<br />
				It may have been moved or deleted.
			</p>
			<Link
				href='/'
				passHref
			>
				<button
					style={{
						padding: '10px 22px',
						background: '#222',
						color: '#fff',
						border: 'none',
						borderRadius: 5,
						fontSize: 16,
						cursor: 'pointer',
						marginBottom: 20,
					}}
				>
					Go to homepage
				</button>
			</Link>
			<a
				href='mailto:support@mealprep360.com'
				style={{ color: '#0070f3', textDecoration: 'underline', fontSize: 15 }}
			>
				Contact support
			</a>
		</div>
	);
}
