import { tw } from '../lib/tailwindStyles.js'
import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { EmptyState, LoadingRows, PageHeading } from "../components/ui.jsx";
import { currency, shortDate } from "../lib/formatters.js";

export function CustomersPage({ customers, loans, loading, onEdit, onView }) {
  const [query, setQuery] = useState("");
  const filtered = customers.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.email || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR PEOPLE"
        title="Customers"
        description="Every customer and their pledged property, together."
      />
      <section className={tw("panel listing-panel")}>
        <div className={tw("listing-toolbar")}>
          <div className={tw("toolbar-title")}>
            <h2>All customers</h2>
            <span>{customers.length}</span>
          </div>
          <label className={tw("table-search")}>
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or phone..."
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
                  <th>CUSTOMER</th>
                  <th>PHONE</th>
                  <th>EMAIL</th>
                  <th>LOANS</th>
                  <th>OUTSTANDING</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const customerLoans = loans.filter(
                    (loan) => loan.customerId?._id === customer._id,
                  );
                  const total = customerLoans
                    .filter((loan) => loan.status !== "completed")
                    .reduce((sum, loan) => sum + loan.principalAmount, 0);
                  return (
                    <tr key={customer._id}>
                      <td>
                        <button
                          className={tw("table-person table-person-button")}
                          onClick={() => onView(customer)}
                        >
                          {customer.photo ? (
                            <img
                              className={tw("person-avatar person-avatar-photo")}
                              src={customer.photo}
                              alt={`${customer.name} profile`}
                            />
                          ) : (
                            <span className={tw("person-avatar")}>
                              {customer.name.charAt(0)}
                            </span>
                          )}
                          <div>
                            <strong>{customer.name}</strong>
                            <small>Added {shortDate(customer.createdAt)}</small>
                          </div>
                        </button>
                      </td>
                      <td>{customer.phone}</td>
                      <td>
                        {customer.email || (
                          <span className={tw("muted-cell")}>Not provided</span>
                        )}
                      </td>
                      <td>{customerLoans.length}</td>
                      <td className={tw("table-money")}>{currency(total)}</td>
                      <td>
                        <button
                          className={tw("table-view")}
                          onClick={() => onEdit(customer)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="customers"
            title={
              customers.length ? "No matching customers" : "No customers yet"
            }
            description={
              customers.length
                ? "Try searching by another name or phone number."
                : "Customers are created alongside a loan so all your records stay connected."
            }
          />
        )}
        <div className={tw("table-footer")}>
          <span>
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{customers.length}</strong> customers
          </span>
        </div>
      </section>
    </>
  );
}
