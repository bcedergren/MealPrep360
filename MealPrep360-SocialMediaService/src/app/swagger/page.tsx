'use client'
// Disable static prerendering for Swagger UI
export const dynamic = 'force-dynamic'

import NextDynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Avoid evaluating swagger-ui-react on the server where window isn't available
const SwaggerUI = NextDynamic(() => import('swagger-ui-react'), { ssr: false })

export default function SwaggerPage() {
  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  )
}
