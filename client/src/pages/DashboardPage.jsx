import { tw } from '../lib/tailwindStyles.js'
import { Icon } from "../components/Icon.jsx";
import { EmptyState, PageHeading, LoanTable } from "../components/ui.jsx";
import { currency, shortDate } from "../lib/formatters.js";

export function Dashboard({ data, loading, onCreate, onNavigate, onView }) {
  const stats = data.stats || {};
  const cards = [
    {
      label: "Total loan amount",
      value: currency(stats.totalLoanAmount),
      icon: "wallet",
      tone: "green",
      sub: `${stats.totalLoans || 0} loans in your portfolio`,
    },
    {
      label: "Active loans",
      value: stats.activeLoans || 0,
      icon: "loans",
      tone: "blue",
      sub: `${stats.overdueLoans || 0} currently overdue`,
    },
    {
      label: "Total customers",
      value: stats.totalCustomers || 0,
      icon: "customers",
      tone: "purple",
      sub: "Across all your records",
    },
    {
      label: "Interest accrued",
      value: currency(stats.totalInterestEarned),
      icon: "trend",
      tone: "amber",
      sub: "Estimated on active loans",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="OVERVIEW"
        title="Good to see you."
        description="Here’s what’s happening with your portfolio today."
        action={
          <button className={tw("button button-primary")} onClick={onCreate}>
            <Icon name="plus" size={18} /> Create new loan
          </button>
        }
      />
      <div className={tw("stats-grid")}>
        {cards.map((card) => (
          <article key={card.label} className={tw("stat-card")}>
            <div className={tw("stat-top")}>
              <span>{card.label}</span>
              <span className={tw(`stat-icon ${card.tone}`)}>
                <Icon name={card.icon} size={19} />
              </span>
            </div>
            <div className={tw("stat-value")}>
              {loading ? (
                <span className={tw("skeleton skeleton-number")} />
              ) : (
                card.value
              )}
            </div>
            <div className={tw("stat-sub")}>{card.sub}</div>
          </article>
        ))}
      </div>
      <div className={tw("dashboard-grid")}>
        <section className={tw("panel portfolio-panel")}>
          <div className={tw("panel-heading")}>
            <div>
              <h2>Portfolio overview</h2>
              <p>A snapshot of your lending activity</p>
            </div>
            <button
              className={tw("text-button")}
              onClick={() => onNavigate("Reports")}
            >
              View reports <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className={tw("portfolio-summary")}>
            <div>
              <small>Active principal</small>
              <strong>{loading ? "—" : currency(stats.activePrincipal)}</strong>
            </div>
            <div className={tw("portfolio-divider")} />
            <div>
              <small>Payments collected</small>
              <strong>{loading ? "—" : currency(stats.totalPayments)}</strong>
            </div>
          </div>
          {data.loans.length ? (
            <MiniChart loans={data.loans} />
          ) : (
            <div className={tw("chart-empty")}>
              <div className={tw("empty-chart-icon")}>
                <Icon name="trend" size={21} />
              </div>
              <strong>Your portfolio starts here</strong>
              <span>Create your first loan to see activity over time.</span>
            </div>
          )}
          <div className={tw("chart-months")}>
            <span>Loan activity</span>
            <span>Updated just now</span>
          </div>
        </section>
        <section className={tw("panel attention-panel")}>
          <div className={tw("panel-heading")}>
            <div>
              <h2>Needs attention</h2>
              <p>Loans with upcoming due dates</p>
            </div>
            <span className={tw("attention-count")}>{stats.overdueLoans || 0}</span>
          </div>
          {data.loans.filter((loan) => loan.status === "overdue").length ? (
            data.loans
              .filter((loan) => loan.status === "overdue")
              .slice(0, 3)
              .map((loan) => (
                <button
                  className={tw("attention-row")}
                  key={loan._id}
                  onClick={() => onView(loan)}
                >
                  <span className={tw("attention-dot")} />
                  <span className={tw("attention-copy")}>
                    <strong>{loan.customerId?.name || "Customer"}</strong>
                    <small>
                      {loan.loanId} · Due {shortDate(loan.dueDate)}
                    </small>
                  </span>
                  <strong>{currency(loan.principalAmount)}</strong>
                </button>
              ))
          ) : (
            <div className={tw("attention-empty")}>
              <span className={tw("attention-check")}>
                <Icon name="check" size={17} />
              </span>
              <div>
                <strong>All caught up</strong>
                <p>No overdue loans to follow up on.</p>
              </div>
            </div>
          )}
          <button
            className={tw("panel-bottom-link")}
            onClick={() => onNavigate("Loans")}
          >
            View all loans <Icon name="arrow" size={15} />
          </button>
        </section>
      </div>
      <section className={tw("panel recent-panel")}>
        <div className={tw("panel-heading")}>
          <div>
            <h2>Recent loans</h2>
            <p>Your latest loan activity</p>
          </div>
          <button className={tw("text-button")} onClick={() => onNavigate("Loans")}>
            See all <Icon name="arrow" size={15} />
          </button>
        </div>
        {data.loans.length ? (
          <LoanTable loans={data.loans.slice(0, 5)} onView={onView} compact />
        ) : (
          <EmptyState
            icon="loans"
            title="No loans yet"
            description="Create your first loan to start keeping your records organized."
            action={
              <button
                className={tw("button button-secondary button-small")}
                onClick={onCreate}
              >
                <Icon name="plus" size={16} /> Create a loan
              </button>
            }
          />
        )}
      </section>
    </>
  );
}

export function MiniChart({ loans }) {
  const max = Math.max(...loans.map((loan) => loan.principalAmount || 0), 1);
  const bars = loans.slice(0, 8).reverse();
  return (
    <div className={tw("mini-chart")} role="img" aria-label="Relative loan amounts">
      <div className={tw("chart-lines")}>
        <span />
        <span />
        <span />
      </div>
      <div className={tw("chart-bars")}>
        {bars.map((loan, index) => (
          <div
            className={tw("chart-bar-wrap")}
            key={loan._id}
            title={`${loan.loanId}: ${currency(loan.principalAmount)}`}
          >
            <span
              className={tw(`chart-bar ${index === bars.length - 1 ? "chart-bar-highlight" : ""}`)}
              style={{
                height: `${Math.max(8, (loan.principalAmount / max) * 100)}%`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
