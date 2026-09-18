import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import ThemeProvider, { type Theme } from './ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('pv-theme')?.value
  const initialTheme: Theme = raw === 'dark' || raw === 'warm' ? raw : 'light'

  return (
    <ThemeProvider initialTheme={initialTheme} fontVariable={inter.variable}>
      {children}
    </ThemeProvider>
  )
}
