import { tw } from './lib/tailwindStyles.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './components/Icon.jsx'
import { Modal } from './components/ui.jsx'
import { LoanWizard, PaymentForm, LoanDetails, EditLoan, EditCustomer, CustomerDetails } from './components/LoanForms.jsx'
import { request } from './lib/api.js'
import { AuthScreen } from './pages/AuthPage.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import { pagePaths } from './routes/pagePaths.js'
import { LandingPage } from './pages/LandingPage.jsx'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const page = Object.keys(pagePaths).find((name) => pagePaths[name] === location.pathname) || 'Dashboard'
  function setPage(nextPage) {
    navigate(pagePaths[nextPage] || pagePaths.Dashboard)
  }
  const [token, setToken] = useState(() => localStorage.getItem('five-percentage-token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('five-percentage-user') || 'null') } catch { return null }
  })
  const [data, setData] = useState({ loans: [], customers: [], payments: [], stats: {} })
  const [loading, setLoading] = useState(Boolean(token))
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeToken = useRef(token)
  const logout = useCallback(() => {
    localStorage.removeItem('five-percentage-token')
    localStorage.removeItem('five-percentage-user')
    activeToken.current = ''
    setToken('')
    setUser(null)
    setData({ loans: [], customers: [], payments: [], stats: {} })
    navigate(pagePaths.Dashboard)
  }, [navigate])

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      const [loans, customers, payments, stats] = await Promise.all([
        request('/loans', { token }),
        request('/customers', { token }),
        request('/payments', { token }),
        request('/dashboard', { token }),
      ])
      if (activeToken.current !== token) return
      setData({ loans, customers, payments, stats })
    } catch (error) {
      if (activeToken.current !== token) return
      setNotice(error.message)
      if (error.status === 401) logout()
    } finally {
      if (activeToken.current === token) setLoading(false)
    }
  }, [token, logout])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      if (active) loadData()
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [loadData])
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function authenticate(authToken, profile) {
    localStorage.setItem('five-percentage-token', authToken)
    localStorage.setItem('five-percentage-user', JSON.stringify(profile))
    activeToken.current = authToken
    setToken(authToken)
    setUser(profile)
  }

  async function saveLoan(payload) {
    await request('/loans', { token, method: 'POST', body: JSON.stringify(payload) })
    setModal(null)
    setPage('Loans')
    setNotice('Your new loan has been created.')
    await loadData()
  }

  async function recordPayment(payload) {
    await request('/payments', { token, method: 'POST', body: JSON.stringify(payload) })
    setModal(null)
    setNotice('Payment recorded successfully.')
    await loadData()
  }

  async function updateLoan(id, payload) {
    await request(`/loans/${id}`, { token, method: 'PATCH', body: JSON.stringify(payload) })
    setModal(null)
    setNotice('Loan updated successfully.')
    await loadData()
  }

  async function deleteLoan(loan) {
    if (!window.confirm(`Delete loan ${loan.loanId}? This will also remove its payment history.`)) return
    try {
      await request(`/loans/${loan._id}`, { token, method: 'DELETE' })
      setNotice('Loan deleted.')
      await loadData()
    } catch (error) { setNotice(error.message) }
  }

  async function updateCustomer(id, payload) {
    await request(`/customers/${id}`, { token, method: 'PATCH', body: JSON.stringify(payload) })
    setModal(null)
    setNotice('Customer details updated.')
    await loadData()
  }

  if (!token) {
    if (location.pathname === '/login') return <AuthScreen onAuthenticated={authenticate} />
    if (location.pathname === '/') return <LandingPage />
    return <AuthScreen onAuthenticated={authenticate} />
  }

  const nav = ['Dashboard', 'Loans', 'Customers', 'Payments', 'Reports', 'Settings']
  return (
    <div className={tw(tw("app-shell"))}>
      {sidebarOpen && <button className={tw(tw("sidebar-backdrop"))} aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={tw(tw(`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`))}>
        <a className="mb-12 ml-[7px] flex h-[33px] items-center gap-2.5 text-[#17251f] no-underline" href="#" onClick={(event) => { event.preventDefault(); setPage('Dashboard'); setSidebarOpen(false) }}>
          <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-emerald-700 text-[11px] font-extrabold leading-none tracking-[-0.7px] text-white">5%</span>
          <span className="text-[15px] font-bold leading-none tracking-[-0.5px] text-[#17251f]">five<span className="mt-1 block text-[9px] font-semibold uppercase leading-none tracking-[1.65px] text-[#84918a]">percent</span></span>
        </a>
        <div className={tw(tw("workspace-label"))}>WORKSPACE</div>
        <nav className={tw(tw("side-nav"))}>
          {nav.map((item) => (
            <button key={item} className={tw(tw(`nav-item ${page === item ? 'nav-active' : ''}`))} onClick={() => { setPage(item); setSidebarOpen(false) }}>
              <Icon name={item.toLowerCase()} size={19} /><span>{item}</span>
              {item === 'Loans' && data.loans.length > 0 && <span className={tw(tw("nav-count"))}>{data.loans.length}</span>}
            </button>
          ))}
        </nav>
        <div className={tw(tw("sidebar-bottom"))}>
          <div className={tw(tw("help-card"))}>
            <span className={tw(tw("help-icon"))}><Icon name="shield" size={17} /></span>
            <div><strong>Your data is private</strong><p>Only you can see your records.</p></div>
          </div>
          <button className={tw(tw("profile-button"))} onClick={() => { setPage('Settings'); setSidebarOpen(false) }}>
            <span className={tw(tw("avatar"))}>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            <span className={tw(tw("profile-name"))}><strong>{user?.name || 'Your account'}</strong><small>{user?.email || 'Account settings'}</small></span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      <nav className={tw(tw("mobile-tabbar"))} aria-label="Main navigation">
        {['Dashboard', 'Loans', 'Customers', 'Payments', 'More'].map((item) => {
          const icon = item === 'More' ? 'menu' : item.toLowerCase()
          const active = item === 'More' ? page === 'Reports' || page === 'Settings' || page === 'Notifications' : page === item
          return (
            <button
              key={item}
              className={tw(tw(`mobile-tab ${active ? 'mobile-tab-active' : 'mobile-tab-inactive'}`))}
              aria-current={active ? 'page' : undefined}
              aria-expanded={item === 'More' ? sidebarOpen : undefined}
              onClick={() => item === 'More' ? setSidebarOpen(true) : setPage(item)}
            >
              <Icon name={icon} size={20} />
              <span>{item}</span>
            </button>
          )
        })}
      </nav>

      <div className={tw(tw("main-area"))}>
        <header className={tw(tw("topbar"))}>
          <button className={tw(tw("icon-button mobile-menu"))} onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className={tw(tw("breadcrumb"))}><span>Workspace</span><span className={tw(tw("crumb-slash"))}>/</span><strong>{page}</strong></div>
          <div className={tw(tw("topbar-actions"))}>
            <button className={tw(tw("search-shortcut"))} onClick={() => setPage('Loans')}><Icon name="search" size={17} /><span>Search loans...</span><kbd>⌘ K</kbd></button>
            <span className={tw(tw("topbar-divider"))} />
            <button className={tw(tw("icon-button notification-button"))} onClick={() => { setPage('Notifications'); setSidebarOpen(false) }} aria-label="Notifications"><Icon name="bell" size={19} /></button>
            <button
              className="grid size-[29px] place-items-center rounded-full border-0 bg-[#e8f1eb] text-[11px] font-bold text-[#3e6e55]"
              onClick={() => setPage('Settings')}
              aria-label="Open settings"
              title="Settings"
            >
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <main className={tw(tw("page-content"))}>
          <AppRoutes
            data={data}
            loading={loading}
            user={user}
            onCreateLoan={() => setModal({ type: 'loan' })}
            onViewLoan={(loan) => setModal({ type: 'loan-detail', loan })}
            onEditLoan={(loan) => setModal({ type: 'edit-loan', loan })}
            onDeleteLoan={deleteLoan}
            onPayLoan={(loan) => setModal({ type: 'payment', loan })}
            onEditCustomer={(customer) => setModal({ type: 'edit-customer', customer })}
            onViewCustomer={(customer) => setModal({ type: 'customer-detail', customer })}
            onCreatePayment={() => setModal({ type: 'payment' })}
            onNavigate={setPage}
            onLogout={logout}
          />
        </main>
      </div>
      {modal && <Modal onClose={() => setModal(null)}>
        {modal.type === 'loan' && <LoanWizard customers={data.customers} token={token} onSave={saveLoan} onCancel={() => setModal(null)} />}
        {modal.type === 'payment' && <PaymentForm loans={data.loans} initialLoan={modal.loan} onSave={recordPayment} onCancel={() => setModal(null)} />}
        {modal.type === 'loan-detail' && <LoanDetails loan={modal.loan} onClose={() => setModal(null)} />}
        {modal.type === 'edit-loan' && <EditLoan loan={modal.loan} onSave={(payload) => updateLoan(modal.loan._id, payload)} onCancel={() => setModal(null)} />}
        {modal.type === 'edit-customer' && <EditCustomer customer={modal.customer} onSave={(payload) => updateCustomer(modal.customer._id, payload)} onCancel={() => setModal(null)} />}
        {modal.type === 'customer-detail' && <CustomerDetails customer={modal.customer} loans={data.loans.filter((loan) => loan.customerId?._id === modal.customer._id)} onClose={() => setModal(null)} onViewLoan={(loan) => setModal({ type: 'loan-detail', loan })} />}
      </Modal>}
      {notice && <div role="status" className={tw(tw("toast"))}><span className={tw(tw("toast-check"))}><Icon name="check" size={16} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><Icon name="close" size={16} /></button></div>}
    </div>
  )
}

export default App
