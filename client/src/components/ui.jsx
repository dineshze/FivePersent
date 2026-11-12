import { tw } from '../lib/tailwindStyles.js'
import { useEffect } from 'react'
import { Icon } from './Icon.jsx'
import { currency, shortDate } from '../lib/formatters.js'

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className={tw("page-heading")}><div><div className={tw("page-eyebrow")}>{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

export function StatusBadge({ status }) {
  const label = status === 'overdue' ? 'Overdue' : status === 'completed' ? 'Completed' : 'Active'
  return <span className={tw(`status-badge status-${status}` )}><i />{label}</span>
}

export function LoanTable({ loans, onView, compact = false }) {
  return <div className={tw("table-scroll")}><table><thead><tr><th>LOAN ID</th><th>CUSTOMER</th><th>PRINCIPAL</th><th>DUE DATE</th><th>STATUS</th><th /></tr></thead><tbody>{loans.map((loan) => <tr key={loan._id}><td><button className={tw("loan-id")} onClick={() => onView(loan)}>{loan.loanId}</button></td><td><div className={tw("table-person")}><span className={tw("person-avatar")}>{(loan.customerId?.name || 'C').charAt(0)}</span><div><strong>{loan.customerId?.name || 'Customer'}</strong><small>{loan.customerId?.phone || '—'}</small></div></div></td><td className={tw("table-money")}>{currency(loan.principalAmount)}</td><td>{shortDate(loan.dueDate)}</td><td><StatusBadge status={loan.status} /></td><td><button className={tw("table-view")} onClick={() => onView(loan)}>{compact ? <Icon name="arrow" size={16} /> : 'View'}</button></td></tr>)}</tbody></table></div>
}

export function SummaryStat({ label, value, icon, tone }) {
  return <article className={tw("stat-card")}><div className={tw("stat-top")}><span>{label}</span><span className={tw(`stat-icon ${tone}`)}><Icon name={icon} size={19} /></span></div><div className={tw("stat-value")}>{value}</div><div className={tw("stat-sub")}>Recorded payments</div></article>
}

export function EmptyState({ icon, title, description, action }) {
  return <div className={tw("empty-state")}><span className={tw("empty-icon")}><Icon name={icon} size={23} /></span><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function LoadingRows() {
  return <div className={tw("loading-rows")}><span /><span /><span /></div>
}

export function Modal({ children, onClose }) {
  useEffect(() => {
    function onKey(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className={tw("modal-backdrop")} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={tw("modal")} role="dialog" aria-modal="true">{children}</section></div>
}

export function Field({ label, children, className = '' }) {
  return <label className={tw(`field ${className}`)}><span>{label}</span>{children}</label>
}

export function WizardActions({ onCancel, onBack, next }) {
  return <div className={tw("wizard-actions")}><button type="button" className={tw("button button-secondary")} onClick={onBack || onCancel}>{onBack ? <><Icon name="left" size={16} /> Back</> : 'Cancel'}</button><button className={tw("button button-primary")} type="submit">{next ? <>Continue <Icon name="arrow" size={16} /></> : 'Save'}</button></div>
}

export function ReviewSection({ title, rows, onEdit }) {
  return <div className={tw("review-section")}><div className={tw("review-section-heading")}><strong>{title}</strong><button onClick={onEdit}>Edit</button></div>{rows.map((row, index) => <div className={tw("review-row")} key={index}>{row.map((item, itemIndex) => <span key={itemIndex}>{item}</span>)}</div>)}</div>
}

export function Detail({ label, value }) {
  return <div className={tw("detail-item")}><span>{label}</span><strong>{value || '—'}</strong></div>
}
