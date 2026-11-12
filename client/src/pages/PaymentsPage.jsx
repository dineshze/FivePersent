import { tw } from '../lib/tailwindStyles.js'
import { Icon } from "../components/Icon.jsx";
import {
  EmptyState,
  LoadingRows,
  PageHeading,
  SummaryStat,
} from "../components/ui.jsx";
import { currency, shortDate } from "../lib/formatters.js";

export function PaymentsPage({ payments, loans, loading, onCreate }) {
  return (
    <>
      <PageHeading
        eyebrow="CASH FLOW"
        title="Payments"
        description="Record and review every principal and interest payment."
        action={
          <button
            className={tw("button button-primary")}
            onClick={onCreate}
            disabled={!loans.length}
          >
            <Icon name="plus" size={18} /> Record payment
          </button>
        }
      />
      <div className={tw("stats-grid stats-grid-three")}>
        <SummaryStat
          label="Payments collected"
          value={currency(
            payments.reduce((sum, payment) => sum + payment.amount, 0),
          )}
          icon="wallet"
          tone="green"
        />
        <SummaryStat
          label="Principal received"
          value={currency(
            payments
              .filter((payment) => payment.paymentType === "principal")
              .reduce((sum, payment) => sum + payment.amount, 0),
          )}
          icon="loans"
          tone="blue"
        />
        <SummaryStat
          label="Interest received"
          value={currency(
            payments
              .filter((payment) => payment.paymentType === "interest")
              .reduce((sum, payment) => sum + payment.amount, 0),
          )}
          icon="trend"
          tone="amber"
        />
      </div>
      <section className={tw("panel listing-panel payment-list")}>
        <div className={tw("panel-heading")}>
          <div>
            <h2>Payment history</h2>
            <p>Manually recorded payments across all loans</p>
          </div>
        </div>
        {loading ? (
          <LoadingRows />
        ) : payments.length ? (
          <div className={tw("table-scroll")}>
            <table>
              <thead>
                <tr>
                  <th>PAYMENT</th>
                  <th>LOAN ID</th>
                  <th>CUSTOMER</th>
                  <th>TYPE</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const loan = loans.find(
                    (item) =>
                      item._id === (payment.loanId?._id || payment.loanId),
                  );
                  return (
                    <tr key={payment._id}>
                      <td>
                        <span className={tw("payment-symbol")}>
                          <Icon name="check" size={15} />
                        </span>
                      </td>
                      <td>
                        <span className={tw("loan-id-static")}>
                          {loan?.loanId || "Loan"}
                        </span>
                      </td>
                      <td>{loan?.customerId?.name || "Customer"}</td>
                      <td>
                        <span
                          className={tw(`payment-type type-${payment.paymentType}`)}
                        >
                          {payment.paymentType}
                        </span>
                      </td>
                      <td>{shortDate(payment.paymentDate)}</td>
                      <td className={tw("table-money")}>
                        {currency(payment.amount)}
                      </td>
                      <td className={tw("notes-cell")}>{payment.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="payments"
            title="No payments recorded"
            description={
              loans.length
                ? "Record a payment to track principal and interest received."
                : "Create a loan first, then record payments against it."
            }
            action={
              Boolean(loans.length) && (
                <button
                  className={tw("button button-secondary button-small")}
                  onClick={onCreate}
                >
                  <Icon name="plus" size={16} /> Record a payment
                </button>
              )
            }
          />
        )}
      </section>
    </>
  );
}
