'use client';

import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useMediaQuery } from '@mui/material';

interface PageHeaderProps {
	title: string;
	description?: string;
	backgroundColor?: string;
	icon?: ReactNode;
	image?: string;
	rightAction?: ReactNode;
}

export function PageHeader({
	title,
	description,
	backgroundColor = 'linear-gradient(45deg, #FF5722 30%, #FF9800 90%)',
	icon,
	image,
	rightAction,
}: PageHeaderProps) {
	const isMobile = useMediaQuery('(max-width:600px)');
	return (
		<Box
			sx={{
				background: backgroundColor,
				color: 'white',
				p: 4,
				mb: 4,
				borderRadius: 2,
				position: 'relative',
				overflow: 'hidden',
				width: '100%',
				mx: 'auto',
			}}
			className='no-print'
		>
			<Box sx={{ position: 'relative', zIndex: 1 }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: { xs: 'stretch', sm: 'flex-start' },
						gap: 2,
						flexDirection: { xs: 'column', sm: 'row' },
					}}
				>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant='h4'
							component='h1'
							gutterBottom
							sx={{
								fontWeight: 'bold',
								textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
								fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
							}}
						>
							{title}
						</Typography>
						{description && !isMobile && (
							<Typography
								variant='h6'
								sx={{ opacity: 0.9 }}
							>
								{description}
							</Typography>
						)}
					</Box>
					{rightAction && (
						<Box
							sx={{
								mt: { xs: 2, sm: 1 },
								alignSelf: { xs: 'flex-start', sm: 'flex-start' },
								minWidth: { xs: 'auto', sm: 'fit-content' },
								display: 'flex',
								justifyContent: { xs: 'flex-start', sm: 'flex-start' },
							}}
						>
							{rightAction}
						</Box>
					)}
				</Box>
			</Box>
			{icon && (
				<Box
					sx={{
						position: 'absolute',
						right: -10,
						top: -10,
						opacity: 0.2,
						transform: 'rotate(15deg)',
						'& svg': {
							fontSize: 250,
						},
					}}
				>
					{icon}
				</Box>
			)}
			{image && (
				<Box
					sx={{
						position: 'absolute',
						right: 0,
						top: 0,
						width: '100%',
						height: '100%',
						opacity: 0.1,
						backgroundImage: `url(${image})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						zIndex: 0,
					}}
				/>
			)}
		</Box>
	);
}
