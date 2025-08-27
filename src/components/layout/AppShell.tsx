export default function AppShell({children, breadcrumb}) {
  return (
    <div className='min-h-screen flex flex-col'>
      <header className='p-4 shadow'>Plan2Fund NextGen</header>
      {breadcrumb && <nav className='px-4 text-sm text-gray-500'>{breadcrumb.join(' / ')}</nav>}
      <main className='flex-1 p-4'>{children}</main>
      <footer className='p-4 text-center text-xs text-gray-400'>© 2025 Plan2Fund</footer>
    </div>
  )
}

