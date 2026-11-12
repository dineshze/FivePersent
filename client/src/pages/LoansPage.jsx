import { tw } from '../lib/tailwindStyles.js'
import { useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import {
  EmptyState,
  LoadingRows,
  PageHeading,
  StatusBadge,
} from "../components/ui.jsx";
import { currency, shortDate } from "../lib/formatters.js";

export function LoansPage({
  loans,
  customers,
  loading,
  onCreate,
  onView,
  onEdit,
  onDelete,
  onPay,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All loans");
  const options = ["All loans", "Active", "Completed", "Overdue"];
  const filtered = useMemo(
    () =>
      loans.filter((loan) => {
        const matchesStatus =
          filter === "All loans" || loan.status === filter.toLowerCase();
        const matchesText =
          `${loan.loanId} ${loan.customerId?.name || ""} ${loan.customerId?.phone || ""}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return matchesStatus && matchesText;
      }),
    [loans, query, filter],
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR PORTFOLIO"
        title="Loans"
        description="Keep every loan, due date and follow-up in view."
        action={
          <button className={tw("button button-primary")} onClick={onCreate}>
            <Icon name="plus" size={18} /> Create new loan
          </button>
        }
      />
      <section className={tw("panel listing-panel")}>
        <div className={tw("listing-toolbar")}>
          <div className={tw("filter-tabs")}>
            {options.map((option) => (
              <button
                className={tw(filter === option ? "filter-active" : "")}
                key={option}
                onClick={() => setFilter(option)}
              >
                {option}
                {option === "All loans" && <span>{loans.length}</span>}
              </button>
            ))}
          </div>
          <label className={tw("table-search")}>
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loans..."
            />
          </label>
        </div>
        {loading ? (
          <LoadingRows />
        ) : filtered.length ? (
          <div className={tw("table-scroll")}>
            <table>
              <thead>
                <tr>
                  <th>LOAN ID</th>
                  <th>CUSTOMER</th>
                  <th>PRINCIPAL</th>
                  <th>INTEREST</th>
                  <th>LOAN DATE</th>
                  <th>DUE DATE</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan) => (
                  <tr key={loan._id}>
                    <td>
                      <button className={tw("loan-id")} onClick={() => onView(loan)}>
                        {loan.loanId}
                      </button>
                    </td>
                    <td>
                      <div className={tw("table-person")}>
                        {loan.customerId?.photo ? (
                          <img
                            className={tw("person-avatar person-avatar-photo")}
                            src={loan.customerId.photo}
                            alt={`${loan.customerId.name || "Customer"} profile`}
                          />
                        ) : (
                          <span className={tw("person-avatar")}>
                            {(loan.customerId?.name || "C").charAt(0)}
                          </span>
                        )}
                        <div>
                          <strong>{loan.customerId?.name || "Customer"}</strong>
                          <small>{loan.customerId?.phone || "—"}</small>
                        </div>
                      </div>
                    </td>
                    <td className={tw("table-money")}>
                      {currency(loan.principalAmount)}
                    </td>
                    <td>
                      {loan.interestRate}%{" "}
                      <span className={tw("muted-cell")}>
                        / {loan.interestType === "monthly" ? "mo" : "yr"}
                      </span>
                    </td>
                    <td>{shortDate(loan.startDate)}</td>
                    <td>{shortDate(loan.dueDate)}</td>
                    <td>
                      <StatusBadge status={loan.status} />
                    </td>
                    <td>
                      <RowMenu
                        loan={loan}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPay={onPay}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="loans"
            title={
              loans.length ? "No matching loans" : "Your loans will appear here"
            }
            description={
              loans.length
                ? "Try another search or status filter."
                : "Add your first loan to start tracking principal, interest and due dates."
            }
            action={
              !loans.length && (
                <button
                  className={tw("button button-secondary button-small")}
                  onClick={onCreate}
                >
                  <Icon name="plus" size={16} /> Create a loan
                </button>
              )
            }
          />
        )}
        <div className={tw("table-footer")}>
          <span>
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{loans.length}</strong> loans
          </span>
          <span>All amounts in Indian Rupees</span>
        </div>
      </section>
      {customers.length === 0 && !loading && (
        <p className={tw("page-footnote")}>
          Customers are added automatically when you create a loan.
        </p>
      )}
    </>
  );
}

export function RowMenu({ loan, onView, onEdit, onDelete, onPay }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={tw("row-menu-wrap")}>
      <button
        className={tw("row-menu-button")}
        onClick={() => setOpen(!open)}
        aria-label="Loan actions"
      >
        <Icon name="more" size={19} />
      </button>
      {open && (
        <>
          <button
            className={tw("menu-dismiss")}
            onClick={() => setOpen(false)}
            aria-label="Close actions"
          />
          <div className={tw("row-menu")}>
            <button
              onClick={() => {
                setOpen(false);
                onView(loan);
              }}
            >
              View details
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onPay(loan);
              }}
            >
              Record payment
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onEdit(loan);
              }}
            >
              Edit loan
            </button>
            <button
              className={tw("danger-menu")}
              onClick={() => {
                setOpen(false);
                onDelete(loan);
              }}
            >
              Delete loan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
