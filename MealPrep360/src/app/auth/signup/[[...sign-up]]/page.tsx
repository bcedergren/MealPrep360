'use client'

import { Box } from '@mui/material'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  const redirectUrl = undefined

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
      <SignUp
        routing="hash"
        // redirectUrl is deprecated; use the new fallbackRedirectUrl
        fallbackRedirectUrl={redirectUrl || '/dashboard'}
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
