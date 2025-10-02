'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
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
				width={80}
				height={80}
				style={{ marginBottom: 16 }}
				priority
			/>
			<h1 style={{ fontSize: 32, marginBottom: 8 }}>
				Oops! Something went wrong.
			</h1>
			<p
				style={{
					fontSize: 18,
					marginBottom: 24,
					maxWidth: 400,
					textAlign: 'center',
				}}
			>
				We’re sorry for the inconvenience. An unexpected error occurred.
				<br />
				Please try again, or contact support if the problem persists.
			</p>
			<Image
				src='/images/HowItWorks.png'
				alt='Friendly illustration'
				width={220}
				height={120}
				style={{ marginBottom: 24, borderRadius: 8 }}
				priority
			/>
			{error?.message && (
				<details
					style={{
						background: '#fff3cd',
						color: '#856404',
						border: '1px solid #ffeeba',
						borderRadius: 6,
						padding: 12,
						marginBottom: 20,
						maxWidth: 420,
						fontSize: 14,
					}}
				>
					<summary style={{ cursor: 'pointer', fontWeight: 500 }}>
						Error details
					</summary>
					<div>
						<div>{error.message}</div>
						{error.digest && (
							<div style={{ marginTop: 4, color: '#aaa' }}>
								Ref: {error.digest}
							</div>
						)}
					</div>
				</details>
			)}
			<div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
				<button
					onClick={() => reset()}
					style={{
						padding: '10px 22px',
						background: '#222',
						color: '#fff',
						border: 'none',
						borderRadius: 5,
						fontSize: 16,
						cursor: 'pointer',
					}}
				>
					Try again
				</button>
				<Link
					href='/'
					passHref
				>
					<button
						style={{
							padding: '10px 22px',
							background: '#eee',
							color: '#222',
							border: '1px solid #ccc',
							borderRadius: 5,
							fontSize: 16,
							cursor: 'pointer',
						}}
					>
						Go to homepage
					</button>
				</Link>
			</div>
			<a
				href='mailto:support@mealprep360.com'
				style={{ color: '#0070f3', textDecoration: 'underline', fontSize: 15 }}
			>
				Contact support
			</a>
		</div>
	);
}
