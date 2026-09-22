import type { ReactNode } from 'react'

/** Centers content and reserves space for the fixed bottom nav. Mobile is
 * a single column; tablet/desktop get a comfortably centered column rather
 * than stretching full-width (per the responsive design requirements). */
export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-4">{children}</main>
}
