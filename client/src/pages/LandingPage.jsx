import { useState } from 'react'
import { Link } from 'react-router-dom'
import { request } from '../lib/api.js'
import { shortDate } from '../lib/formatters.js'

export function LandingPage() {
  const [loanId, setLoanId] = useState('')
  const [loan, setLoan] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function checkStatus(event) {
    event.preventDefault()
    setBusy(true)
    setLoan(null)
    setError('')
    try {
      setLoan(await request(`/public/loans/${encodeURIComponent(loanId.trim())}`))
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="brand" href="/" aria-label="Five Percent home">
          <span className="brand-mark">5%</span>
          <span className="brand-name">five<span>percent</span></span>
        </a>
        <Link className="button button-secondary" to="/login">Sign in <span aria-hidden="true">→</span></Link>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> SIMPLE LOAN MANAGEMENT</div>
            <h1>Clear records.<br /><em>Confident decisions.</em></h1>
            <p>Manage loans, customers and repayments in one calm, organized workspace.</p>
            <Link className="button button-primary" to="/login">Get started <span aria-hidden="true">→</span></Link>
            <div className="landing-trust">Private by design <span>·</span> Built for India</div>
          </div>
          <div className="landing-art" aria-hidden="true">
            <div className="landing-art-orbit orbit-a" /><div className="landing-art-orbit orbit-b" />
            <div className="landing-art-card"><div className="landing-art-label">PORTFOLIO OVERVIEW</div><div className="landing-art-amount">₹ 8,45,000</div><div className="landing-art-rule" /><div className="landing-art-row"><span>Active loans</span><strong>24</strong></div><div className="landing-art-row"><span>Repayments tracked</span><strong>On time</strong></div><div className="landing-art-bars"><i /><i /><i /><i /><i /><i /><i /></div></div>
            <div className="landing-art-chip">✓ &nbsp; All records in one place</div>
          </div>
        </section>
        <section className="status-section" id="loan-status">
          <div className="status-intro"><span className="status-icon">↗</span><div><div className="eyebrow">QUICK LOOKUP</div><h2>Check your loan status</h2><p>Enter the loan ID from your receipt to see its current status.</p></div></div>
          <form className="status-form" onSubmit={checkStatus}>
            <label htmlFor="loan-id">Loan ID</label>
            <div className="status-input-row"><input id="loan-id" value={loanId} onChange={(event) => setLoanId(event.target.value)} placeholder="e.g. FP-2026-…" required /><button className="button button-primary" disabled={busy}>{busy ? 'Checking…' : 'Check status'} <span aria-hidden="true">→</span></button></div>
          </form>
          {error && <p className="status-error" role="alert">{error}</p>}
          {loan && <div className="status-result" role="status"><div><span className="status-result-label">LOAN STATUS</span><h3>{loan.status}</h3><p>{loan.loanId}</p></div><div className="status-dates"><span>Started <strong>{shortDate(loan.startDate)}</strong></span><span>Due date <strong>{shortDate(loan.dueDate)}</strong></span></div></div>}
        </section>
        <section className="landing-features"><div><span>01</span><h3>Know what’s due</h3><p>See important dates and loan status at a glance.</p></div><div><span>02</span><h3>Keep records together</h3><p>Customer, property and repayment details stay connected.</p></div><div><span>03</span><h3>Print a receipt</h3><p>Open a loan record and print a clean copy whenever you need it.</p></div></section>
      </main>
      <footer className="landing-footer"><span>© {new Date().getFullYear()} Five Percent</span><span>Financial clarity, every day.</span></footer>
    </div>
  )
}
