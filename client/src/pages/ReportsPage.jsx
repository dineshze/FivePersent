import { tw } from '../lib/tailwindStyles.js'
import {
  EmptyState,
  LoadingRows,
  PageHeading,
  StatusBadge,
  SummaryStat,
} from "../components/ui.jsx";
import { currency } from "../lib/formatters.js";

export function ReportsPage({ data, loading }) {
  const statusCounts = ["active", "overdue", "completed"].map((status) => ({
    status,
    count: data.loans.filter((loan) => loan.status === status).length,
  }));
  const total = data.loans.reduce(
    (sum, loan) => sum + (loan.principalAmount || 0),
    0,
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR NUMBERS"
        title="Reports"
        description="A clear picture of your current portfolio."
      />
      <div className={tw("stats-grid")}>
        <SummaryStat
          label="Total principal issued"
          value={currency(total)}
          icon="wallet"
          tone="green"
        />
        <SummaryStat
          label="Interest received"
          value={currency(
            data.payments
              .filter((payment) => payment.paymentType === "interest")
              .reduce((sum, payment) => sum + payment.amount, 0),
          )}
          icon="trend"
          tone="amber"
        />
        <SummaryStat
          label="Principal outstanding"
          value={currency(data.stats.activePrincipal)}
          icon="loans"
          tone="blue"
        />
        <SummaryStat
          label="Customers served"
          value={data.customers.length}
          icon="customers"
          tone="purple"
        />
      </div>
      <section className={tw("panel report-panel")}>
        <div className={tw("panel-heading")}>
          <div>
            <h2>Loan status</h2>
            <p>Distribution across your portfolio</p>
          </div>
        </div>
        {loading ? (
          <LoadingRows />
        ) : data.loans.length ? (
          <div className={tw("status-report")}>
            {statusCounts.map(({ status, count }) => (
              <div className={tw("status-report-row")} key={status}>
                <div className={tw("status-report-label")}>
                  <StatusBadge status={status} />
                  <strong>{count}</strong>
                </div>
                <div className={tw("report-track")}>
                  <span
                    className={tw(`report-fill fill-${status}`)}
                    style={{ width: `${(count / data.loans.length) * 100}%` }}
                  />
                </div>
                <small>
                  {Math.round((count / data.loans.length) * 100)}% of loans
                </small>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="reports"
            title="Reports will appear here"
            description="Your portfolio breakdown will be available once you have created a loan."
          />
        )}
      </section>
    </>
  );
}
