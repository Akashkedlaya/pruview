import TopNav from '../components/TopNav'
import Sidebar from './components/Sidebar'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen pt-16" style={{ backgroundColor: 'var(--pv-bg)' }}>
      <TopNav />
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
