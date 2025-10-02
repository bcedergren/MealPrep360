'use client'

import { Box, Container, Typography, Button, Paper } from '@mui/material'
import { SignInButton, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function HomePage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/dashboard')
    }
  }, [isLoaded, userId, router])

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 1,
        }}
      >
        <Box
          sx={{ mb: 4, position: 'relative', width: '300px', height: '100px' }}
        >
          <Image
            src="/logo.png"
            alt="MealPrep360 Logo"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Welcome to MealPrep360 Admin
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px' }}
          >
            Manage your recipes, users, and content from one central dashboard.
            Sign in to get started.
          </Typography>
          <SignInButton mode="modal" afterSignInUrl="/dashboard">
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
          </SignInButton>
        </Paper>
      </Box>
    </Container>
  )
}
