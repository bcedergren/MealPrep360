'use client';

import { Providers } from './providers';

export function ClientLayout({ children }: { children: React.ReactNode }) {
	return <Providers>{children}</Providers>;
}
