'use client'

import { Box } from '@mui/material'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#2E5C3A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Box sx={{ pt: 8, pb: 4, textAlign: 'center' }}></Box>
      <SignIn
        routing="hash"
        // redirectUrl is deprecated; use the new fallbackRedirectUrl
        fallbackRedirectUrl={redirectUrl}
        appearance={{
          elements: {
            footerActionLink: 'text-primary hover:text-primary/90',
            footer: 'hidden',
          },
        }}
      />
    </Box>
  )
}
