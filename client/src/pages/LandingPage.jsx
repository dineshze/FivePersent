import { useState } from 'react'
import { Link } from 'react-router-dom'
import { request } from '../lib/api.js'
import { shortDate } from '../lib/formatters.js'
import { tw } from '../lib/tailwindStyles.js'

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
    <div className={tw('landing-page')}>
      <header className={tw('landing-nav')}>
        <a className="flex h-auto items-center gap-2.5 text-[#17251f] no-underline" href="/" aria-label="Five Percent home">
          <span className="grid size-7.5 shrink-0 place-items-center rounded-[9px] bg-emerald-700 text-[11px] font-extrabold leading-none tracking-[-0.7px] text-white">5%</span>
          <span className="text-[15px] font-bold leading-none tracking-[-0.5px] text-[#17251f]">five<span className="mt-1 block text-[9px] font-semibold uppercase leading-none tracking-[1.65px] text-[#84918a]">percent</span></span>
        </a>
        <Link className={tw('button button-secondary')} to="/login">Sign in <span aria-hidden="true">→</span></Link>
      </header>
      <main>
        <section className={tw('landing-hero')}>
          <div className={tw('landing-copy')}>
            <div className={tw('eyebrow')}><span className={tw('eyebrow-dot')} /> SIMPLE LOAN MANAGEMENT</div>
            <h1>Clear records.<br /><em>Confident decisions.</em></h1>
            <p>Manage loans, customers and repayments in one calm, organized workspace.</p>
            <Link className={tw('button button-primary')} to="/login">Get started <span aria-hidden="true">→</span></Link>
            <div className={tw('landing-trust')}>Private by design <span>·</span> Built for India</div>
          </div>
          <div className={tw('landing-art')} aria-hidden="true">
            <div className={tw('landing-art-orbit orbit-a')} /><div className={tw('landing-art-orbit orbit-b')} />
            <div className={tw('landing-art-card')}><div className={tw('landing-art-label')}>PORTFOLIO OVERVIEW</div><div className={tw('landing-art-amount')}>₹ 8,45,000</div><div className={tw('landing-art-rule')} /><div className={tw('landing-art-row')}><span>Active loans</span><strong>24</strong></div><div className={tw('landing-art-row')}><span>Repayments tracked</span><strong>On time</strong></div><div className={tw('landing-art-bars')}><i /><i /><i /><i /><i /><i /><i /></div></div>
            <div className={tw('landing-art-chip')}>✓ &nbsp; All records in one place</div>
          </div>
        </section>
        <section className={tw('status-section')} id="loan-status">
          <div className={tw('status-intro')}><span className={tw('status-icon')}>↗</span><div><div className={tw('eyebrow')}>QUICK LOOKUP</div><h2>Check your loan status</h2><p>Enter the loan ID from your receipt to see its current status.</p></div></div>
          <form className={tw('status-form')} onSubmit={checkStatus}>
            <label htmlFor="loan-id">Loan ID</label>
            <div className={tw('status-input-row')}><input id="loan-id" value={loanId} onChange={(event) => setLoanId(event.target.value)} placeholder="e.g. FP-2026-…" required /><button className={tw('button button-primary')} disabled={busy}>{busy ? 'Checking…' : 'Check status'} <span aria-hidden="true">→</span></button></div>
          </form>
          {error && <p className={tw('status-error')} role="alert">{error}</p>}
          {loan && <div className={tw('status-result')} role="status"><div><span className={tw('status-result-label')}>LOAN STATUS</span><h3>{loan.status}</h3><p>{loan.loanId}</p></div><div className={tw('status-dates')}><span>Started <strong>{shortDate(loan.startDate)}</strong></span><span>Due date <strong>{shortDate(loan.dueDate)}</strong></span></div></div>}
        </section>
        <section className={tw('landing-features')}><div><span>01</span><h3>Know what’s due</h3><p>See important dates and loan status at a glance.</p></div><div><span>02</span><h3>Keep records together</h3><p>Customer, property and repayment details stay connected.</p></div><div><span>03</span><h3>Print a receipt</h3><p>Open a loan record and print a clean copy whenever you need it.</p></div></section>
      </main>
      <footer className={tw('landing-footer')}><span>© {new Date().getFullYear()} Five Percent</span><span>Financial clarity, every day.</span></footer>
    </div>
  )
}
