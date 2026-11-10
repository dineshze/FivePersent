import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API = '/api'

const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  loans: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6m3-3h-6" /></>,
  payments: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  reports: <><path d="M4 19V5m0 14h17M8 15l4-4 3 2 5-6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  arrow: <><path d="M5 12h14m-7-7 7 7-7 7" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  left: <path d="m15 18-6-6 6-6" />,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18m-5 5h2" /><path d="M7 5V3h11" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 20h16" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
}

function Icon({ name, size = 20, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

const currency = (amount = 0) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(amount) || 0)

const shortDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const today = () => new Date().toISOString().slice(0, 10)

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('five-percentage-token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('five-percentage-user') || 'null') } catch { return null }
  })
  const [page, setPage] = useState('Dashboard')
  const [data, setData] = useState({ loans: [], customers: [], payments: [], stats: {} })
  const [loading, setLoading] = useState(Boolean(token))
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeToken = useRef(token)
  activeToken.current = token

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
  }, [token])

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
    setToken(authToken)
    setUser(profile)
  }

  function logout() {
    localStorage.removeItem('five-percentage-token')
    localStorage.removeItem('five-percentage-user')
    setToken('')
    setUser(null)
    setData({ loans: [], customers: [], payments: [], stats: {} })
    setPage('Dashboard')
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

  if (!token) return <AuthScreen onAuthenticated={authenticate} />

  const nav = ['Dashboard', 'Loans', 'Customers', 'Payments', 'Reports', 'Settings']
  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('Dashboard'); setSidebarOpen(false) }}>
          <span className="brand-mark"><span /></span>
          <span className="brand-name">five<span>percentage</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map((item) => (
            <button key={item} className={`nav-item ${page === item ? 'nav-active' : ''}`} onClick={() => { setPage(item); setSidebarOpen(false) }}>
              <Icon name={item.toLowerCase()} size={19} /><span>{item}</span>
              {item === 'Loans' && data.loans.length > 0 && <span className="nav-count">{data.loans.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Icon name="shield" size={17} /></span>
            <div><strong>Your data is private</strong><p>Only you can see your records.</p></div>
          </div>
          <button className="profile-button" onClick={() => setPage('Settings')}>
            <span className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            <span className="profile-name"><strong>{user?.name || 'Your account'}</strong><small>{user?.email || 'Account settings'}</small></span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      <nav className="mobile-tabbar" aria-label="Main navigation">
        {['Dashboard', 'Loans', 'Customers', 'Payments', 'More'].map((item) => {
          const icon = item === 'More' ? 'menu' : item.toLowerCase()
          const active = item === 'More' ? page === 'Reports' || page === 'Settings' : page === item
          return (
            <button
              key={item}
              className={`mobile-tab ${active ? 'mobile-tab-active' : ''}`}
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

      <div className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div>
          <div className="topbar-actions">
            <button className="search-shortcut" onClick={() => setPage('Loans')}><Icon name="search" size={17} /><span>Search loans...</span><kbd>⌘ K</kbd></button>
            <span className="topbar-divider" />
            <button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={19} /><i /></button>
            <span className="avatar avatar-small">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <main className="page-content">
          {page === 'Dashboard' && <Dashboard data={data} loading={loading} onCreate={() => setModal({ type: 'loan' })} onNavigate={setPage} onView={(loan) => setModal({ type: 'loan-detail', loan })} />}
          {page === 'Loans' && <LoansPage loans={data.loans} customers={data.customers} loading={loading} onCreate={() => setModal({ type: 'loan' })} onView={(loan) => setModal({ type: 'loan-detail', loan })} onEdit={(loan) => setModal({ type: 'edit-loan', loan })} onDelete={deleteLoan} onPay={(loan) => setModal({ type: 'payment', loan })} />}
          {page === 'Customers' && <CustomersPage customers={data.customers} loans={data.loans} loading={loading} onEdit={(customer) => setModal({ type: 'edit-customer', customer })} onView={(customer) => setModal({ type: 'customer-detail', customer })} />}
          {page === 'Payments' && <PaymentsPage payments={data.payments} loans={data.loans} loading={loading} onCreate={() => setModal({ type: 'payment' })} />}
          {page === 'Reports' && <ReportsPage data={data} loading={loading} />}
          {page === 'Settings' && <SettingsPage user={user} onLogout={logout} />}
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
      {notice && <div role="status" className="toast"><span className="toast-check"><Icon name="check" size={16} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><Icon name="close" size={16} /></button></div>}
    </div>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })
      onAuthenticated(result.token, result.user)
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand"><span className="brand-mark"><span /></span><span className="brand-name">five<span>percentage</span></span></div>
      <div className="auth-layout">
        <section className="auth-promo">
          <div className="promo-orb orb-one" /><div className="promo-orb orb-two" />
          <div className="promo-content">
            <div className="eyebrow"><span className="eyebrow-dot" /> MADE FOR YOUR BUSINESS</div>
            <h1>Clarity for every<br /><em>commitment.</em></h1>
            <p>A simpler way to manage your loans, customers and payments — all in one place.</p>
            <div className="promo-points"><span><Icon name="check" size={16} /> Private by design</span><span><Icon name="check" size={16} /> Built for India</span></div>
          </div>
          <div className="promo-foot"><span>FINANCIAL CLARITY, EVERY DAY</span><span>01 — 03</span></div>
        </section>
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <div className="auth-mobile-title">Welcome to Five Percentage</div>
            <div className="auth-heading">
              <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p>{mode === 'login' ? 'Enter your details to sign in to your account.' : 'Get started with a free, secure account.'}</p>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <form onSubmit={submit} className="auth-form">
              {mode === 'register' && <>
                <Field label="Full name"><input required minLength="2" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ananya Sharma" /></Field>
                <Field label="Phone number"><input required type="tel" autoComplete="tel" pattern="[+0-9 ()-]{8,20}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
              </>}
              <Field label="Email address"><input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></Field>
              <Field label="Password"><input required type="password" minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></Field>
              {mode === 'login' && <div className="auth-options"><label className="checkbox-label"><input type="checkbox" /> Remember me</label><span>Secure sign in <Icon name="shield" size={14} /></span></div>}
              <button className="button button-primary auth-submit" disabled={busy}>{busy ? <span className="spinner" /> : mode === 'login' ? 'Sign in' : 'Create account'}{!busy && <Icon name="arrow" size={17} />}</button>
            </form>
            <div className="auth-switch">{mode === 'login' ? 'New to Five Percentage?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
            <div className="auth-privacy"><Icon name="shield" size={15} /> Passwords are securely hashed. Your records stay private.</div>
          </div>
          <div className="auth-copyright">© {new Date().getFullYear()} Five Percentage <span>·</span> Thoughtfully made for your business</div>
        </section>
      </div>
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Dashboard({ data, loading, onCreate, onNavigate, onView }) {
  const stats = data.stats || {}
  const cards = [
    { label: 'Total loan amount', value: currency(stats.totalLoanAmount), icon: 'wallet', tone: 'green', sub: `${stats.totalLoans || 0} loans in your portfolio` },
    { label: 'Active loans', value: stats.activeLoans || 0, icon: 'loans', tone: 'blue', sub: `${stats.overdueLoans || 0} currently overdue` },
    { label: 'Total customers', value: stats.totalCustomers || 0, icon: 'customers', tone: 'purple', sub: 'Across all your records' },
    { label: 'Interest accrued', value: currency(stats.totalInterestEarned), icon: 'trend', tone: 'amber', sub: 'Estimated on active loans' },
  ]
  return <>
    <PageHeading eyebrow="OVERVIEW" title="Good to see you." description="Here’s what’s happening with your portfolio today." action={<button className="button button-primary" onClick={onCreate}><Icon name="plus" size={18} /> Create new loan</button>} />
    <div className="stats-grid">{cards.map((card) => <article key={card.label} className="stat-card"><div className="stat-top"><span>{card.label}</span><span className={`stat-icon ${card.tone}`}><Icon name={card.icon} size={19} /></span></div><div className="stat-value">{loading ? <span className="skeleton skeleton-number" /> : card.value}</div><div className="stat-sub">{card.sub}</div></article>)}</div>
    <div className="dashboard-grid">
      <section className="panel portfolio-panel">
        <div className="panel-heading"><div><h2>Portfolio overview</h2><p>A snapshot of your lending activity</p></div><button className="text-button" onClick={() => onNavigate('Reports')}>View reports <Icon name="arrow" size={15} /></button></div>
        <div className="portfolio-summary"><div><small>Active principal</small><strong>{loading ? '—' : currency(stats.activePrincipal)}</strong></div><div className="portfolio-divider" /><div><small>Payments collected</small><strong>{loading ? '—' : currency(stats.totalPayments)}</strong></div></div>
        {data.loans.length ? <MiniChart loans={data.loans} /> : <div className="chart-empty"><div className="empty-chart-icon"><Icon name="trend" size={21} /></div><strong>Your portfolio starts here</strong><span>Create your first loan to see activity over time.</span></div>}
        <div className="chart-months"><span>Loan activity</span><span>Updated just now</span></div>
      </section>
      <section className="panel attention-panel">
        <div className="panel-heading"><div><h2>Needs attention</h2><p>Loans with upcoming due dates</p></div><span className="attention-count">{stats.overdueLoans || 0}</span></div>
        {data.loans.filter((loan) => loan.status === 'overdue').length ? data.loans.filter((loan) => loan.status === 'overdue').slice(0, 3).map((loan) => <button className="attention-row" key={loan._id} onClick={() => onView(loan)}><span className="attention-dot" /><span className="attention-copy"><strong>{loan.customerId?.name || 'Customer'}</strong><small>{loan.loanId} · Due {shortDate(loan.dueDate)}</small></span><strong>{currency(loan.principalAmount)}</strong></button>) : <div className="attention-empty"><span className="attention-check"><Icon name="check" size={17} /></span><div><strong>All caught up</strong><p>No overdue loans to follow up on.</p></div></div>}
        <button className="panel-bottom-link" onClick={() => onNavigate('Loans')}>View all loans <Icon name="arrow" size={15} /></button>
      </section>
    </div>
    <section className="panel recent-panel">
      <div className="panel-heading"><div><h2>Recent loans</h2><p>Your latest loan activity</p></div><button className="text-button" onClick={() => onNavigate('Loans')}>See all <Icon name="arrow" size={15} /></button></div>
      {data.loans.length ? <LoanTable loans={data.loans.slice(0, 5)} onView={onView} compact /> : <EmptyState icon="loans" title="No loans yet" description="Create your first loan to start keeping your records organized." action={<button className="button button-secondary button-small" onClick={onCreate}><Icon name="plus" size={16} /> Create a loan</button>} />}
    </section>
  </>
}

function MiniChart({ loans }) {
  const max = Math.max(...loans.map((loan) => loan.principalAmount || 0), 1)
  const bars = loans.slice(0, 8).reverse()
  return <div className="mini-chart" role="img" aria-label="Relative loan amounts"><div className="chart-lines"><span /><span /><span /></div><div className="chart-bars">{bars.map((loan, index) => <div className="chart-bar-wrap" key={loan._id} title={`${loan.loanId}: ${currency(loan.principalAmount)}`}><span className={`chart-bar ${index === bars.length - 1 ? 'chart-bar-highlight' : ''}`} style={{ height: `${Math.max(8, (loan.principalAmount / max) * 100)}%` }} /></div>)}</div></div>
}

function LoansPage({ loans, customers, loading, onCreate, onView, onEdit, onDelete, onPay }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All loans')
  const options = ['All loans', 'Active', 'Completed', 'Overdue']
  const filtered = useMemo(() => loans.filter((loan) => {
    const matchesStatus = filter === 'All loans' || loan.status === filter.toLowerCase()
    const matchesText = `${loan.loanId} ${loan.customerId?.name || ''} ${loan.customerId?.phone || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesStatus && matchesText
  }), [loans, query, filter])
  return <>
    <PageHeading eyebrow="YOUR PORTFOLIO" title="Loans" description="Keep every loan, due date and follow-up in view." action={<button className="button button-primary" onClick={onCreate}><Icon name="plus" size={18} /> Create new loan</button>} />
    <section className="panel listing-panel">
      <div className="listing-toolbar"><div className="filter-tabs">{options.map((option) => <button className={filter === option ? 'filter-active' : ''} key={option} onClick={() => setFilter(option)}>{option}{option === 'All loans' && <span>{loans.length}</span>}</button>)}</div><label className="table-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search loans..." /></label></div>
      {loading ? <LoadingRows /> : filtered.length ? <div className="table-scroll"><table><thead><tr><th>LOAN ID</th><th>CUSTOMER</th><th>PRINCIPAL</th><th>INTEREST</th><th>LOAN DATE</th><th>DUE DATE</th><th>STATUS</th><th /></tr></thead><tbody>{filtered.map((loan) => <tr key={loan._id}><td><button className="loan-id" onClick={() => onView(loan)}>{loan.loanId}</button></td><td><div className="table-person"><span className="person-avatar">{(loan.customerId?.name || 'C').charAt(0)}</span><div><strong>{loan.customerId?.name || 'Customer'}</strong><small>{loan.customerId?.phone || '—'}</small></div></div></td><td className="table-money">{currency(loan.principalAmount)}</td><td>{loan.interestRate}% <span className="muted-cell">/ {loan.interestType === 'monthly' ? 'mo' : 'yr'}</span></td><td>{shortDate(loan.startDate)}</td><td>{shortDate(loan.dueDate)}</td><td><StatusBadge status={loan.status} /></td><td><RowMenu loan={loan} onView={onView} onEdit={onEdit} onDelete={onDelete} onPay={onPay} /></td></tr>)}</tbody></table></div> : <EmptyState icon="loans" title={loans.length ? 'No matching loans' : 'Your loans will appear here'} description={loans.length ? 'Try another search or status filter.' : 'Add your first loan to start tracking principal, interest and due dates.'} action={!loans.length && <button className="button button-secondary button-small" onClick={onCreate}><Icon name="plus" size={16} /> Create a loan</button>} />}
      <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{loans.length}</strong> loans</span><span>All amounts in Indian Rupees</span></div>
    </section>
    {customers.length === 0 && !loading && <p className="page-footnote">Customers are added automatically when you create a loan.</p>}
  </>
}

function RowMenu({ loan, onView, onEdit, onDelete, onPay }) {
  const [open, setOpen] = useState(false)
  return <div className="row-menu-wrap"><button className="row-menu-button" onClick={() => setOpen(!open)} aria-label="Loan actions"><Icon name="more" size={19} /></button>{open && <><button className="menu-dismiss" onClick={() => setOpen(false)} aria-label="Close actions" /><div className="row-menu"><button onClick={() => { setOpen(false); onView(loan) }}>View details</button><button onClick={() => { setOpen(false); onPay(loan) }}>Record payment</button><button onClick={() => { setOpen(false); onEdit(loan) }}>Edit loan</button><button className="danger-menu" onClick={() => { setOpen(false); onDelete(loan) }}>Delete loan</button></div></>}</div>
}

function StatusBadge({ status }) {
  const label = status === 'overdue' ? 'Overdue' : status === 'completed' ? 'Completed' : 'Active'
  return <span className={`status-badge status-${status}` }><i />{label}</span>
}

function LoanTable({ loans, onView, compact = false }) {
  return <div className="table-scroll"><table><thead><tr><th>LOAN ID</th><th>CUSTOMER</th><th>PRINCIPAL</th><th>DUE DATE</th><th>STATUS</th><th /></tr></thead><tbody>{loans.map((loan) => <tr key={loan._id}><td><button className="loan-id" onClick={() => onView(loan)}>{loan.loanId}</button></td><td><div className="table-person"><span className="person-avatar">{(loan.customerId?.name || 'C').charAt(0)}</span><div><strong>{loan.customerId?.name || 'Customer'}</strong><small>{loan.customerId?.phone || '—'}</small></div></div></td><td className="table-money">{currency(loan.principalAmount)}</td><td>{shortDate(loan.dueDate)}</td><td><StatusBadge status={loan.status} /></td><td><button className="table-view" onClick={() => onView(loan)}>{compact ? <Icon name="arrow" size={16} /> : 'View'}</button></td></tr>)}</tbody></table></div>
}

function CustomersPage({ customers, loans, loading, onEdit, onView }) {
  const [query, setQuery] = useState('')
  const filtered = customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.email || ''}`.toLowerCase().includes(query.toLowerCase()))
  return <>
    <PageHeading eyebrow="YOUR PEOPLE" title="Customers" description="Every customer and their pledged property, together." />
    <section className="panel listing-panel">
      <div className="listing-toolbar"><div className="toolbar-title"><h2>All customers</h2><span>{customers.length}</span></div><label className="table-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or phone..." /></label></div>
      {loading ? <LoadingRows /> : filtered.length ? <div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>PHONE</th><th>EMAIL</th><th>LOANS</th><th>OUTSTANDING</th><th /></tr></thead><tbody>{filtered.map((customer) => {
        const customerLoans = loans.filter((loan) => loan.customerId?._id === customer._id)
        const total = customerLoans.filter((loan) => loan.status !== 'completed').reduce((sum, loan) => sum + loan.principalAmount, 0)
        return <tr key={customer._id}><td><button className="table-person table-person-button" onClick={() => onView(customer)}><span className="person-avatar">{customer.name.charAt(0)}</span><div><strong>{customer.name}</strong><small>Added {shortDate(customer.createdAt)}</small></div></button></td><td>{customer.phone}</td><td>{customer.email || <span className="muted-cell">Not provided</span>}</td><td>{customerLoans.length}</td><td className="table-money">{currency(total)}</td><td><button className="table-view" onClick={() => onEdit(customer)}>Edit</button></td></tr>
      })}</tbody></table></div> : <EmptyState icon="customers" title={customers.length ? 'No matching customers' : 'No customers yet'} description={customers.length ? 'Try searching by another name or phone number.' : 'Customers are created alongside a loan so all your records stay connected.'} />}
      <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{customers.length}</strong> customers</span></div>
    </section>
  </>
}

function PaymentsPage({ payments, loans, loading, onCreate }) {
  return <>
    <PageHeading eyebrow="CASH FLOW" title="Payments" description="Record and review every principal and interest payment." action={<button className="button button-primary" onClick={onCreate} disabled={!loans.length}><Icon name="plus" size={18} /> Record payment</button>} />
    <div className="stats-grid stats-grid-three">
      <SummaryStat label="Payments collected" value={currency(payments.reduce((sum, payment) => sum + payment.amount, 0))} icon="wallet" tone="green" />
      <SummaryStat label="Principal received" value={currency(payments.filter((payment) => payment.paymentType === 'principal').reduce((sum, payment) => sum + payment.amount, 0))} icon="loans" tone="blue" />
      <SummaryStat label="Interest received" value={currency(payments.filter((payment) => payment.paymentType === 'interest').reduce((sum, payment) => sum + payment.amount, 0))} icon="trend" tone="amber" />
    </div>
    <section className="panel listing-panel payment-list">
      <div className="panel-heading"><div><h2>Payment history</h2><p>Manually recorded payments across all loans</p></div></div>
      {loading ? <LoadingRows /> : payments.length ? <div className="table-scroll"><table><thead><tr><th>PAYMENT</th><th>LOAN ID</th><th>CUSTOMER</th><th>TYPE</th><th>DATE</th><th>AMOUNT</th><th>NOTES</th></tr></thead><tbody>{payments.map((payment) => {
        const loan = loans.find((item) => item._id === (payment.loanId?._id || payment.loanId))
        return <tr key={payment._id}><td><span className="payment-symbol"><Icon name="check" size={15} /></span></td><td><span className="loan-id-static">{loan?.loanId || 'Loan'}</span></td><td>{loan?.customerId?.name || 'Customer'}</td><td><span className={`payment-type type-${payment.paymentType}`}>{payment.paymentType}</span></td><td>{shortDate(payment.paymentDate)}</td><td className="table-money">{currency(payment.amount)}</td><td className="notes-cell">{payment.notes || '—'}</td></tr>
      })}</tbody></table></div> : <EmptyState icon="payments" title="No payments recorded" description={loans.length ? 'Record a payment to track principal and interest received.' : 'Create a loan first, then record payments against it.'} action={Boolean(loans.length) && <button className="button button-secondary button-small" onClick={onCreate}><Icon name="plus" size={16} /> Record a payment</button>} />}
    </section>
  </>
}

function SummaryStat({ label, value, icon, tone }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon name={icon} size={19} /></span></div><div className="stat-value">{value}</div><div className="stat-sub">Recorded payments</div></article>
}

function ReportsPage({ data, loading }) {
  const statusCounts = ['active', 'overdue', 'completed'].map((status) => ({ status, count: data.loans.filter((loan) => loan.status === status).length }))
  const total = data.loans.reduce((sum, loan) => sum + (loan.principalAmount || 0), 0)
  return <>
    <PageHeading eyebrow="YOUR NUMBERS" title="Reports" description="A clear picture of your current portfolio." />
    <div className="stats-grid">
      <SummaryStat label="Total principal issued" value={currency(total)} icon="wallet" tone="green" />
      <SummaryStat label="Interest received" value={currency(data.payments.filter((payment) => payment.paymentType === 'interest').reduce((sum, payment) => sum + payment.amount, 0))} icon="trend" tone="amber" />
      <SummaryStat label="Principal outstanding" value={currency(data.stats.activePrincipal)} icon="loans" tone="blue" />
      <SummaryStat label="Customers served" value={data.customers.length} icon="customers" tone="purple" />
    </div>
    <section className="panel report-panel"><div className="panel-heading"><div><h2>Loan status</h2><p>Distribution across your portfolio</p></div></div>{loading ? <LoadingRows /> : data.loans.length ? <div className="status-report">{statusCounts.map(({ status, count }) => <div className="status-report-row" key={status}><div className="status-report-label"><StatusBadge status={status} /><strong>{count}</strong></div><div className="report-track"><span className={`report-fill fill-${status}`} style={{ width: `${(count / data.loans.length) * 100}%` }} /></div><small>{Math.round((count / data.loans.length) * 100)}% of loans</small></div>)}</div> : <EmptyState icon="reports" title="Reports will appear here" description="Your portfolio breakdown will be available once you have created a loan." />}</section>
  </>
}

function SettingsPage({ user, onLogout }) {
  return <>
    <PageHeading eyebrow="PREFERENCES" title="Settings" description="Manage your account and data privacy." />
    <section className="panel settings-panel"><div className="settings-title"><span className="settings-icon"><Icon name="customers" size={20} /></span><div><h2>Account details</h2><p>Your personal information and sign-in identity.</p></div></div><div className="settings-fields"><div><span>Full name</span><strong>{user?.name || '—'}</strong></div><div><span>Email address</span><strong>{user?.email || '—'}</strong></div><div><span>Phone number</span><strong>{user?.phone || '—'}</strong></div></div></section>
    <section className="panel settings-panel"><div className="settings-title"><span className="settings-icon privacy-icon"><Icon name="shield" size={20} /></span><div><h2>Privacy & security</h2><p>Your account data is private to you. All records are scoped to your account.</p></div></div><div className="privacy-note"><Icon name="check" size={16} /> Authentication is secured with encrypted passwords and signed access tokens.</div></section>
    <section className="panel settings-panel logout-panel"><div><h2>Sign out</h2><p>Sign out of your account on this device.</p></div><button className="button button-danger" onClick={onLogout}><Icon name="logout" size={17} /> Sign out</button></section>
  </>
}

function EmptyState({ icon, title, description, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={23} /></span><h3>{title}</h3><p>{description}</p>{action}</div>
}

function LoadingRows() {
  return <div className="loading-rows"><span /><span /><span /></div>
}

function Modal({ children, onClose }) {
  useEffect(() => {
    function onKey(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true">{children}</section></div>
}

function Field({ label, children, className = '' }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}</label>
}

function LoanWizard({ customers, token, onSave, onCancel }) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [customerPhoto, setCustomerPhoto] = useState(null)
  const [propertyImages, setPropertyImages] = useState([])
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', customerAddress: '', propertyName: '', propertyDescription: '', propertyValue: '', propertyNotes: '', propertyImages: '', principalAmount: '', interestRate: '', interestType: 'monthly', startDate: today(), duration: '6 months', dueDate: '', notes: '' })
  const steps = ['Customer', 'Property', 'Loan details', 'Review']
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  function next(event) {
    event.preventDefault()
    setError('')
    if (step === 2 && form.dueDate && form.startDate && new Date(form.dueDate) < new Date(form.startDate)) {
      setError('Due date must be on or after the loan start date.')
      return
    }
    setStep((current) => Math.min(current + 1, 3))
  }
  async function submit() {
    setBusy(true)
    setError('')
    try {
      let customerPhotoUrl = ''
      let propertyImageUrls = form.propertyImages ? form.propertyImages.split(',').map((item) => item.trim()).filter(Boolean) : []
      if (customerPhoto || propertyImages.length) {
        const upload = new FormData()
        if (customerPhoto) upload.append('images', customerPhoto)
        propertyImages.forEach((image) => upload.append('images', image))
        const result = await request('/uploads/images', { token, method: 'POST', body: upload })
        customerPhotoUrl = customerPhoto ? result.images.shift() : ''
        propertyImageUrls = [...propertyImageUrls, ...result.images]
      }
      await onSave({
        customer: { id: form.customerId || undefined, name: form.customerName, phone: form.customerPhone, email: form.customerEmail, address: form.customerAddress, photo: customerPhotoUrl },
        property: { name: form.propertyName, description: form.propertyDescription, estimatedValue: Number(form.propertyValue), notes: form.propertyNotes, images: propertyImageUrls },
        loan: { principalAmount: Number(form.principalAmount), interestRate: Number(form.interestRate), interestType: form.interestType, startDate: form.startDate, duration: form.duration, dueDate: form.dueDate, notes: form.notes },
      })
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <div className="wizard">
    <div className="modal-heading"><div className="modal-eyebrow">NEW RECORD</div><h2>Create a loan</h2><p>Add the details in a few simple steps.</p><button className="modal-close" onClick={onCancel} aria-label="Close"><Icon name="close" /></button></div>
    <div className="wizard-steps">{steps.map((label, index) => <div className={`wizard-step ${step === index ? 'step-current' : ''} ${step > index ? 'step-done' : ''}`} key={label}><span>{step > index ? <Icon name="check" size={14} /> : index + 1}</span><small>{label}</small></div>)}</div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {step === 0 && <form className="wizard-form" onSubmit={next}><div className="section-intro"><strong>Who is this loan for?</strong><span>Customer information is saved securely with this loan.</span></div>
      {customers.length > 0 && <Field label="Existing customer"><select value={form.customerId || ''} onChange={(event) => {
        const customer = customers.find((item) => item._id === event.target.value)
        setForm((current) => ({ ...current, customerId: event.target.value, customerName: customer?.name || '', customerPhone: customer?.phone || '', customerEmail: customer?.email || '', customerAddress: customer?.address || '' }))
      }}><option value="">Add a new customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} · {customer.phone}</option>)}</select></Field>}
      <Field label="Customer full name"><input required minLength="2" autoFocus value={form.customerName} onChange={(event) => update('customerName', event.target.value)} placeholder="e.g. Meera Patel" /></Field>
      <Field label="Customer photo · optional"><input type="file" accept="image/*" onChange={(event) => setCustomerPhoto(event.target.files?.[0] || null)} /><small className="field-hint">JPEG, PNG or WebP. Images are stored securely.</small></Field>
      <div className="form-row"><Field label="Phone number"><input required type="tel" pattern="[+0-9 ()-]{8,20}" value={form.customerPhone} onChange={(event) => update('customerPhone', event.target.value)} placeholder="+91 98765 43210" /></Field><Field label="Email address · optional"><input type="email" value={form.customerEmail} onChange={(event) => update('customerEmail', event.target.value)} placeholder="meera@email.com" /></Field></div>
      <Field label="Full address"><textarea required rows="2" value={form.customerAddress} onChange={(event) => update('customerAddress', event.target.value)} placeholder="Street, area, city and PIN code" /></Field>
      <WizardActions onCancel={onCancel} next />
    </form>}
    {step === 1 && <form className="wizard-form" onSubmit={next}><div className="section-intro"><strong>What property is being pledged?</strong><span>Record details to keep the security linked to this loan.</span></div>
      <Field label="Property name"><input required autoFocus value={form.propertyName} onChange={(event) => update('propertyName', event.target.value)} placeholder="e.g. Gold necklace, Shop unit" /></Field>
      <Field label="Estimated property value"><div className="input-prefix"><span>₹</span><input required type="number" min="0" step="0.01" value={form.propertyValue} onChange={(event) => update('propertyValue', event.target.value)} placeholder="0.00" /></div></Field>
      <Field label="Description · optional"><textarea rows="2" value={form.propertyDescription} onChange={(event) => update('propertyDescription', event.target.value)} placeholder="Details that help identify the property" /></Field>
      <Field label="Property images · optional"><input type="file" accept="image/*" multiple onChange={(event) => setPropertyImages(Array.from(event.target.files || []))} /><small className="field-hint">{propertyImages.length ? `${propertyImages.length} image${propertyImages.length === 1 ? '' : 's'} selected.` : 'Choose multiple JPEG, PNG or WebP images.'}</small></Field>
      <Field label="Image URLs · optional"><input value={form.propertyImages} onChange={(event) => update('propertyImages', event.target.value)} placeholder="Paste image URLs, separated by commas" /></Field>
      <Field label="Additional notes · optional"><textarea rows="2" value={form.propertyNotes} onChange={(event) => update('propertyNotes', event.target.value)} placeholder="Internal notes about the pledged property" /></Field>
      <WizardActions onBack={() => setStep(0)} next />
    </form>}
    {step === 2 && <form className="wizard-form" onSubmit={next}><div className="section-intro"><strong>Set the loan terms</strong><span>Interest is calculated on the server for reliable totals.</span></div>
      <Field label="Loan amount"><div className="input-prefix"><span>₹</span><input required type="number" min="1" step="0.01" value={form.principalAmount} onChange={(event) => update('principalAmount', event.target.value)} placeholder="0.00" /></div></Field>
      <div className="form-row"><Field label="Interest rate"><div className="input-suffix"><input required type="number" min="0" max="100" step="0.01" value={form.interestRate} onChange={(event) => update('interestRate', event.target.value)} placeholder="e.g. 5" /><span>%</span></div></Field><Field label="Interest type"><select value={form.interestType} onChange={(event) => update('interestType', event.target.value)}><option value="monthly">Monthly</option><option value="annually">Annually</option></select></Field></div>
      <div className="form-row"><Field label="Loan start date"><input required type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></Field><Field label="Due date"><input required type="date" min={form.startDate} value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} /></Field></div>
      <Field label="Loan duration"><input required value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="e.g. 6 months" /></Field>
      <Field label="Additional notes · optional"><textarea rows="2" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Any other details about this loan" /></Field>
      <WizardActions onBack={() => setStep(1)} next />
    </form>}
    {step === 3 && <div className="wizard-form review-form"><div className="section-intro"><strong>Review your loan</strong><span>Check everything before creating this record.</span></div>
      <ReviewSection title="Customer" onEdit={() => setStep(0)} rows={[[form.customerName, form.customerPhone], [form.customerEmail || 'No email provided'], [form.customerAddress]]} />
      <ReviewSection title="Pledged property" onEdit={() => setStep(1)} rows={[[form.propertyName, `Est. ${currency(form.propertyValue)}`], [form.propertyDescription || 'No description provided']]} />
      <ReviewSection title="Loan terms" onEdit={() => setStep(2)} rows={[[currency(form.principalAmount), `${form.interestRate}% ${form.interestType}`], [`Starts ${shortDate(form.startDate)}`, `Due ${shortDate(form.dueDate)}`], [form.duration]]} />
      <div className="review-note"><Icon name="shield" size={17} /><span>Your loan and customer records are private to your account.</span></div>
      <div className="wizard-actions"><button className="button button-secondary" onClick={() => setStep(2)}>Back</button><button className="button button-primary" onClick={submit} disabled={busy}>{busy ? <span className="spinner" /> : <><Icon name="check" size={17} /> Create loan</>}</button></div>
    </div>}
  </div>
}

function WizardActions({ onCancel, onBack, next }) {
  return <div className="wizard-actions"><button type="button" className="button button-secondary" onClick={onBack || onCancel}>{onBack ? <><Icon name="left" size={16} /> Back</> : 'Cancel'}</button><button className="button button-primary" type="submit">{next ? <>Continue <Icon name="arrow" size={16} /></> : 'Save'}</button></div>
}

function ReviewSection({ title, rows, onEdit }) {
  return <div className="review-section"><div className="review-section-heading"><strong>{title}</strong><button onClick={onEdit}>Edit</button></div>{rows.map((row, index) => <div className="review-row" key={index}>{row.map((item, itemIndex) => <span key={itemIndex}>{item}</span>)}</div>)}</div>
}

function PaymentForm({ loans, initialLoan, onSave, onCancel }) {
  const [form, setForm] = useState({ loanId: initialLoan?._id || '', amount: '', paymentType: 'principal', paymentDate: today(), notes: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { await onSave({ ...form, amount: Number(form.amount) }) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <div className="simple-modal"><div className="modal-heading"><div className="modal-eyebrow">PAYMENT</div><h2>Record a payment</h2><p>Add a payment received from a customer.</p><button className="modal-close" onClick={onCancel} aria-label="Close"><Icon name="close" /></button></div>{error && <div className="form-error" role="alert">{error}</div>}
    <form className="simple-form" onSubmit={submit}><Field label="Loan"><select required value={form.loanId} onChange={(event) => setForm({ ...form, loanId: event.target.value })}><option value="">Select a loan</option>{loans.filter((loan) => loan.status !== 'completed').map((loan) => <option key={loan._id} value={loan._id}>{loan.loanId} · {loan.customerId?.name} · {currency(loan.principalAmount)}</option>)}</select></Field>
      <Field label="Payment amount"><div className="input-prefix"><span>₹</span><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" /></div></Field>
      <div className="form-row"><Field label="Payment type"><select value={form.paymentType} onChange={(event) => setForm({ ...form, paymentType: event.target.value })}><option value="principal">Principal</option><option value="interest">Interest</option></select></Field><Field label="Payment date"><input required type="date" max={today()} value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} /></Field></div>
      <Field label="Notes · optional"><textarea rows="2" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add a note about this payment" /></Field>
      <div className="wizard-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : 'Save payment'}</button></div>
    </form>
  </div>
}

function LoanDetails({ loan, onClose }) {
  const outstanding = loan.calculation?.totalOutstanding ?? loan.principalAmount
  return <div className="simple-modal"><div className="modal-heading"><div className="modal-eyebrow">{loan.loanId}</div><h2>Loan details</h2><p>Created {shortDate(loan.createdAt)}</p><button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
    <div className="detail-hero"><div><span>Principal amount</span><strong>{currency(loan.principalAmount)}</strong></div><StatusBadge status={loan.status} /></div>
    <div className="detail-grid"><Detail label="Customer" value={loan.customerId?.name} /><Detail label="Phone" value={loan.customerId?.phone} /><Detail label="Interest rate" value={`${loan.interestRate}% ${loan.interestType === 'monthly' ? 'monthly' : 'annually'}`} /><Detail label="Start date" value={shortDate(loan.startDate)} /><Detail label="Due date" value={shortDate(loan.dueDate)} /><Detail label="Duration" value={loan.duration || '—'} /><Detail label="Interest accrued" value={currency(loan.calculation?.accumulatedInterest)} /><Detail label="Outstanding total" value={currency(outstanding)} /><Detail label="Pledged property" value={loan.propertyId?.name} /></div>
    {loan.notes && <div className="detail-notes"><span>Notes</span><p>{loan.notes}</p></div>}
    {loan.propertyId?.images?.length > 0 && <div className="property-images">{loan.propertyId.images.map((image) => <img src={image} alt={loan.propertyId.name} key={image} />)}</div>}
    <div className="wizard-actions"><button className="button button-secondary" onClick={onClose}>Close</button></div>
  </div>
}

function Detail({ label, value }) {
  return <div className="detail-item"><span>{label}</span><strong>{value || '—'}</strong></div>
}

function EditLoan({ loan, onSave, onCancel }) {
  const [form, setForm] = useState({ principalAmount: loan.principalAmount, interestRate: loan.interestRate, interestType: loan.interestType, dueDate: loan.dueDate?.slice(0, 10) || '', duration: loan.duration || '', notes: loan.notes || '', status: loan.status === 'overdue' ? 'active' : loan.status })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try { await onSave({ ...form, principalAmount: Number(form.principalAmount), interestRate: Number(form.interestRate) }) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <div className="simple-modal"><div className="modal-heading"><div className="modal-eyebrow">{loan.loanId}</div><h2>Edit loan</h2><p>Update the loan terms, due date or status.</p><button className="modal-close" onClick={onCancel} aria-label="Close"><Icon name="close" /></button></div>{error && <div className="form-error">{error}</div>}<form className="simple-form" onSubmit={submit}><Field label="Principal amount"><div className="input-prefix"><span>₹</span><input type="number" min="1" step="0.01" required value={form.principalAmount} onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} /></div></Field><div className="form-row"><Field label="Interest rate"><div className="input-suffix"><input type="number" min="0" max="100" step="0.01" required value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} /><span>%</span></div></Field><Field label="Interest type"><select value={form.interestType} onChange={(e) => setForm({ ...form, interestType: e.target.value })}><option value="monthly">Monthly</option><option value="annually">Annually</option></select></Field></div><Field label="Due date"><input type="date" required min={loan.startDate?.slice(0, 10)} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field><Field label="Duration"><input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="completed">Completed</option></select></Field><Field label="Notes"><textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="wizard-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : 'Save changes'}</button></div></form></div>
}

function EditCustomer({ customer, onSave, onCancel }) {
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try { await onSave(form) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <div className="simple-modal"><div className="modal-heading"><div className="modal-eyebrow">CUSTOMER PROFILE</div><h2>Edit customer</h2><p>Update this customer’s contact information.</p><button className="modal-close" onClick={onCancel} aria-label="Close"><Icon name="close" /></button></div>{error && <div className="form-error">{error}</div>}<form className="simple-form" onSubmit={submit}><Field label="Full name"><input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Phone number"><input required type="tel" pattern="[+0-9 ()-]{8,20}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Email address"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Full address"><textarea required rows="3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field><div className="wizard-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <span className="spinner" /> : 'Save changes'}</button></div></form></div>
}

function CustomerDetails({ customer, loans, onClose, onViewLoan }) {
  return <div className="simple-modal"><div className="modal-heading"><div className="modal-eyebrow">CUSTOMER PROFILE</div><h2>{customer.name}</h2><p>Customer since {shortDate(customer.createdAt)}</p><button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div><div className="detail-grid customer-detail-grid"><Detail label="Phone" value={customer.phone} /><Detail label="Email" value={customer.email} /><Detail label="Address" value={customer.address} /></div><div className="customer-loans-heading"><h3>Loans & pledged property</h3><span>{loans.length} {loans.length === 1 ? 'loan' : 'loans'}</span></div>{loans.length ? <div className="customer-loan-list">{loans.map((loan) => <button key={loan._id} onClick={() => onViewLoan(loan)}><span><strong>{loan.propertyId?.name || loan.loanId}</strong><small>{loan.loanId} · {shortDate(loan.startDate)}</small></span><span className="customer-loan-amount">{currency(loan.principalAmount)}<Icon name="arrow" size={15} /></span></button>)}</div> : <div className="inline-empty">No loans associated with this customer.</div>}<div className="wizard-actions"><button className="button button-secondary" onClick={onClose}>Close</button></div></div>
}

export default App
