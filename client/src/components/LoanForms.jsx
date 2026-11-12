import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { request } from "../lib/api.js";
import { today, currency, shortDate } from "../lib/formatters.js";
import {
  Field,
  WizardActions,
  ReviewSection,
  Detail,
  StatusBadge,
} from "./ui.jsx";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function printLoanReceipt(loan) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  const customer = loan.customerId || {};
  const photo = customer.photo
    ? `<img class="avatar" src="${escapeHtml(new URL(customer.photo, window.location.origin).href)}" alt="Customer photo">`
    : `<div class="avatar fallback">${escapeHtml((customer.name || "C").charAt(0).toUpperCase())}</div>`;
  const rows = [
    ["Customer", customer.name], ["Phone", customer.phone],
    ["Principal amount", currency(loan.principalAmount)],
    ["Interest rate", `${loan.interestRate}% ${loan.interestType === "monthly" ? "monthly" : "annually"}`],
    ["Start date", shortDate(loan.startDate)], ["Due date", shortDate(loan.dueDate)],
    ["Duration", loan.duration || "—"],
    ["Interest accrued", currency(loan.calculation?.accumulatedInterest)],
    ["Outstanding total", currency(loan.calculation?.totalOutstanding ?? loan.principalAmount)],
    ["Pledged property", loan.propertyId?.name],
  ];
  printWindow.document.write(`<!doctype html><html><head><title>Loan receipt ${escapeHtml(loan.loanId)}</title><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:48px;color:#26372e;font:14px Arial,sans-serif}.receipt{max-width:720px;margin:auto;border:1px solid #dfe8e2;padding:36px}.brand{color:#167b57;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase}.title{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #167b57;padding:15px 0 20px}.title h1{font-size:25px;margin:0 0 7px}.muted{color:#738178;font-size:12px}.status{padding:8px 12px;border-radius:20px;background:#edf7f1;color:#167b57;font-weight:bold;text-transform:capitalize}.customer{display:flex;align-items:center;gap:15px;margin:24px 0;padding:16px;background:#f7faf8;border-radius:8px}.avatar{width:64px;height:64px;object-fit:cover;border-radius:50%;border:1px solid #dfe8e2}.fallback{display:grid;place-items:center;background:#eaf6ef;color:#167b57;font-size:24px;font-weight:bold}.customer strong{display:block;font-size:17px;margin-bottom:5px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 25px}.item{padding:12px 0;border-bottom:1px solid #edf1ee}.label{display:block;color:#849087;font-size:10px;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px}.value{font-weight:600}.notes{margin-top:18px;padding-top:12px;border-top:1px solid #edf1ee}.footer{margin-top:32px;padding-top:15px;border-top:1px solid #dfe8e2;color:#849087;font-size:10px;text-align:center}
    @media print{body{padding:0}.receipt{border:0;padding:12mm;max-width:none}.customer,.status{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><article class="receipt"><div class="brand">Five Percent</div><header class="title"><div><h1>Loan receipt</h1><div class="muted">Loan ID: ${escapeHtml(loan.loanId)}</div><div class="muted">Created ${escapeHtml(shortDate(loan.createdAt))}</div></div><span class="status">${escapeHtml(loan.status)}</span></header><section class="customer">${photo}<div><strong>${escapeHtml(customer.name || "Customer")}</strong><span class="muted">${escapeHtml(customer.phone || "")}</span></div></section><section class="grid">${rows.map(([label, value]) => `<div class="item"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value || "—")}</span></div>`).join("")}</section>${loan.notes ? `<section class="notes"><span class="label">Notes</span>${escapeHtml(loan.notes)}</section>` : ""}<footer class="footer">Generated on ${escapeHtml(shortDate(new Date()))}</footer></article><script>window.onload=()=>{const image=document.querySelector('.avatar');if(image&&!image.complete){image.onload=image.onerror=()=>window.print()}else{window.print()}}</script></body></html>`);
  printWindow.document.close();
}

export function LoanWizard({ customers, token, onSave, onCancel }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [propertyImages, setPropertyImages] = useState([]);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    propertyName: "",
    propertyDescription: "",
    propertyValue: "",
    propertyNotes: "",
    propertyImages: "",
    principalAmount: "",
    interestRate: "",
    interestType: "monthly",
    startDate: today(),
    duration: "6 months",
    dueDate: "",
    notes: "",
  });
  const steps = ["Customer", "Property", "Loan details", "Review"];
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  function next(event) {
    event.preventDefault();
    setError("");
    if (
      step === 2 &&
      form.dueDate &&
      form.startDate &&
      new Date(form.dueDate) < new Date(form.startDate)
    ) {
      setError("Due date must be on or after the loan start date.");
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      let customerPhotoUrl = "";
      let propertyImageUrls = form.propertyImages
        ? form.propertyImages
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      if (customerPhoto || propertyImages.length) {
        const upload = new FormData();
        if (customerPhoto) upload.append("images", customerPhoto);
        propertyImages.forEach((image) => upload.append("images", image));
        const result = await request("/uploads/images", {
          token,
          method: "POST",
          body: upload,
        });
        customerPhotoUrl = customerPhoto ? result.images.shift() : "";
        propertyImageUrls = [...propertyImageUrls, ...result.images];
      }
      await onSave({
        customer: {
          id: form.customerId || undefined,
          name: form.customerName,
          phone: form.customerPhone,
          email: form.customerEmail,
          address: form.customerAddress,
          photo: customerPhotoUrl,
        },
        property: {
          name: form.propertyName,
          description: form.propertyDescription,
          estimatedValue: Number(form.propertyValue),
          notes: form.propertyNotes,
          images: propertyImageUrls,
        },
        loan: {
          principalAmount: Number(form.principalAmount),
          interestRate: Number(form.interestRate),
          interestType: form.interestType,
          startDate: form.startDate,
          duration: form.duration,
          dueDate: form.dueDate,
          notes: form.notes,
        },
      });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="p-[23px_25px_20px] max-[420px]:px-4 max-[420px]:pt-5 max-[420px]:pb-[17px]">
      <div className="relative mb-[17px]">
        <div className="mb-1.5 text-[#84938a] text-[9px] max-[650px]:text-[10px] tracking-[1.25px] font-bold">
          NEW RECORD
        </div>
        <h2 className="m-0 text-[#24352b] text-[18px] max-[650px]:text-[20px] tracking-[-0.4px] font-bold">
          Create a loan
        </h2>
        <p className="mt-1.5 mb-0 text-[#909b94] text-[10px] max-[650px]:text-[11px]">
          Add the details in a few simple steps.
        </p>
        <button
          className="absolute top-0 right-0 grid place-items-center p-[5px] border-0 rounded-[5px] text-[#87928b] bg-transparent hover:bg-[#f3f6f4] transition cursor-pointer"
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="flex items-start my-[21px] mb-[19px]">
        {steps.map((label, index) => (
          <div
            className={`relative flex flex-1 flex-col items-center gap-1.5 [&:not(:last-child)::after]:content-[''] [&:not(:last-child)::after]:absolute [&:not(:last-child)::after]:top-[13px] [&:not(:last-child)::after]:left-[calc(50%+17px)] [&:not(:last-child)::after]:w-[calc(100%-33px)] [&:not(:last-child)::after]:border-t ${
              step > index
                ? "[&:not(:last-child)::after]:border-[#9cc9ae]"
                : "[&:not(:last-child)::after]:border-[#e9eeeb]"
            } ${step === index ? "text-[#2e7a56]" : "text-[#9da69f]"}`}
            key={label}
          >
            <span
              className={`w-[27px] h-[27px] z-10 grid place-items-center rounded-full text-[9px] font-semibold border ${
                step >= index
                  ? "border-[#207d58] text-white bg-[#207d58]"
                  : "border-[#e8ede9] text-[#909b94] bg-white"
              }`}
            >
              {step > index ? <Icon name="check" size={14} /> : index + 1}
            </span>
            <small
              className={`text-[8px] max-[650px]:text-[9px] ${
                step === index ? "font-bold" : ""
              }`}
            >
              {label}
            </small>
          </div>
        ))}
      </div>
      {error && (
        <div
          className="my-3 px-2.5 py-[9px] border border-[#f1dddd] rounded-[5px] text-[#a04e4e] bg-[#fff8f8] text-[9px] leading-relaxed"
          role="alert"
        >
          {error}
        </div>
      )}
      {step === 0 && (
        <form className="grid gap-[13px]" onSubmit={next}>
          <div className="grid gap-1 mb-0.5">
            <strong className="text-[#3d4d43] text-[11px] max-[650px]:text-[13px] font-semibold">
              Who is this loan for?
            </strong>
            <span className="text-[#9aa39e] text-[9px] max-[650px]:text-[11px] max-[650px]:leading-[1.45]">
              Customer information is saved securely with this loan.
            </span>
          </div>
          {customers.length > 0 && (
            <Field label="Existing customer">
              <select
                value={form.customerId || ""}
                onChange={(event) => {
                  const customer = customers.find(
                    (item) => item._id === event.target.value,
                  );
                  setForm((current) => ({
                    ...current,
                    customerId: event.target.value,
                    customerName: customer?.name || "",
                    customerPhone: customer?.phone || "",
                    customerEmail: customer?.email || "",
                    customerAddress: customer?.address || "",
                  }));
                }}
              >
                <option value="">Add a new customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} · {customer.phone}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Customer full name">
            <input
              required
              minLength="2"
              autoFocus
              value={form.customerName}
              onChange={(event) => update("customerName", event.target.value)}
              placeholder="e.g. Meera Patel"
            />
          </Field>
          <Field label="Customer photo · optional">
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setCustomerPhoto(event.target.files?.[0] || null)
              }
            />
            <small className="text-[#9aa39e] text-[8px] max-[650px]:text-[10px] font-normal">
              JPEG, PNG or WebP. Images are stored securely.
            </small>
          </Field>
          <div className="grid grid-cols-2 gap-3 max-[420px]:gap-2">
            <Field label="Phone number">
              <input
                required
                type="tel"
                pattern="[+0-9 ()-]{8,20}"
                value={form.customerPhone}
                onChange={(event) =>
                  update("customerPhone", event.target.value)
                }
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Email address · optional">
              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  update("customerEmail", event.target.value)
                }
                placeholder="meera@email.com"
              />
            </Field>
          </div>
          <Field label="Full address">
            <textarea
              required
              rows="2"
              value={form.customerAddress}
              onChange={(event) =>
                update("customerAddress", event.target.value)
              }
              placeholder="Street, area, city and PIN code"
            />
          </Field>
          <WizardActions onCancel={onCancel} next />
        </form>
      )}
      {step === 1 && (
        <form className="grid gap-[13px]" onSubmit={next}>
          <div className="grid gap-1 mb-0.5">
            <strong className="text-[#3d4d43] text-[11px] max-[650px]:text-[13px] font-semibold">
              What property is being pledged?
            </strong>
            <span className="text-[#9aa39e] text-[9px] max-[650px]:text-[11px] max-[650px]:leading-[1.45]">
              Record details to keep the security linked to this loan.
            </span>
          </div>
          <Field label="Property name">
            <input
              required
              autoFocus
              value={form.propertyName}
              onChange={(event) => update("propertyName", event.target.value)}
              placeholder="e.g. Gold necklace, Shop unit"
            />
          </Field>
          <Field label="Estimated property value">
            <div className="relative [&_input]:pl-[25px]">
              <span className="absolute top-1/2 left-[10px] -translate-y-1/2 text-[#8c9991] text-[10px] font-medium pointer-events-none">
                ₹
              </span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.propertyValue}
                onChange={(event) =>
                  update("propertyValue", event.target.value)
                }
                placeholder="0.00"
              />
            </div>
          </Field>
          <Field label="Description · optional">
            <textarea
              rows="2"
              value={form.propertyDescription}
              onChange={(event) =>
                update("propertyDescription", event.target.value)
              }
              placeholder="Details that help identify the property"
            />
          </Field>
          <Field label="Property images · optional">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setPropertyImages(Array.from(event.target.files || []))
              }
            />
            <small className="text-[#9aa39e] text-[8px] max-[650px]:text-[10px] font-normal">
              {propertyImages.length
                ? `${propertyImages.length} image${propertyImages.length === 1 ? "" : "s"} selected.`
                : "Choose multiple JPEG, PNG or WebP images."}
            </small>
          </Field>
          <Field label="Image URLs · optional">
            <input
              value={form.propertyImages}
              onChange={(event) => update("propertyImages", event.target.value)}
              placeholder="Paste image URLs, separated by commas"
            />
          </Field>
          <Field label="Additional notes · optional">
            <textarea
              rows="2"
              value={form.propertyNotes}
              onChange={(event) => update("propertyNotes", event.target.value)}
              placeholder="Internal notes about the pledged property"
            />
          </Field>
          <WizardActions onBack={() => setStep(0)} next />
        </form>
      )}
      {step === 2 && (
        <form className="grid gap-[13px]" onSubmit={next}>
          <div className="grid gap-1 mb-0.5">
            <strong className="text-[#3d4d43] text-[11px] max-[650px]:text-[13px] font-semibold">
              Set the loan terms
            </strong>
            <span className="text-[#9aa39e] text-[9px] max-[650px]:text-[11px] max-[650px]:leading-[1.45]">
              Interest is calculated on the server for reliable totals.
            </span>
          </div>
          <Field label="Loan amount">
            <div className="relative [&_input]:pl-[25px]">
              <span className="absolute top-1/2 left-[10px] -translate-y-1/2 text-[#8c9991] text-[10px] font-medium pointer-events-none">
                ₹
              </span>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={form.principalAmount}
                onChange={(event) =>
                  update("principalAmount", event.target.value)
                }
                placeholder="0.00"
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3 max-[420px]:gap-2">
            <Field label="Interest rate">
              <div className="relative [&_input]:pr-[25px]">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(event) =>
                    update("interestRate", event.target.value)
                  }
                  placeholder="e.g. 5"
                />
                <span className="absolute top-1/2 right-[10px] -translate-y-1/2 text-[#8c9991] text-[10px] font-medium pointer-events-none">
                  %
                </span>
              </div>
            </Field>
            <Field label="Interest type">
              <select
                value={form.interestType}
                onChange={(event) => update("interestType", event.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 max-[420px]:gap-2">
            <Field label="Loan start date">
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </Field>
            <Field label="Due date">
              <input
                required
                type="date"
                min={form.startDate}
                value={form.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Loan duration">
            <input
              required
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="e.g. 6 months"
            />
          </Field>
          <Field label="Additional notes · optional">
            <textarea
              rows="2"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Any other details about this loan"
            />
          </Field>
          <WizardActions onBack={() => setStep(1)} next />
        </form>
      )}
      {step === 3 && (
        <div className="grid gap-[11px]">
          <div className="grid gap-1 mb-0.5">
            <strong className="text-[#3d4d43] text-[11px] max-[650px]:text-[13px] font-semibold">
              Review your loan
            </strong>
            <span className="text-[#9aa39e] text-[9px] max-[650px]:text-[11px] max-[650px]:leading-[1.45]">
              Check everything before creating this record.
            </span>
          </div>
          <ReviewSection
            title="Customer"
            onEdit={() => setStep(0)}
            rows={[
              [form.customerName, form.customerPhone],
              [form.customerEmail || "No email provided"],
              [form.customerAddress],
            ]}
          />
          <ReviewSection
            title="Pledged property"
            onEdit={() => setStep(1)}
            rows={[
              [form.propertyName, `Est. ${currency(form.propertyValue)}`],
              [form.propertyDescription || "No description provided"],
            ]}
          />
          <ReviewSection
            title="Loan terms"
            onEdit={() => setStep(2)}
            rows={[
              [
                currency(form.principalAmount),
                `${form.interestRate}% ${form.interestType}`,
              ],
              [
                `Starts ${shortDate(form.startDate)}`,
                `Due ${shortDate(form.dueDate)}`,
              ],
              [form.duration],
            ]}
          />
          <div className="flex items-center gap-2 mt-0.5 text-[#789080] text-[8px] max-[650px]:text-[10px]">
            <Icon name="shield" size={17} />
            <span>
              Your loan and customer records are private to your account.
            </span>
          </div>
          <div className="flex justify-between gap-2.5 mt-1.5 pt-3.5 border-t border-[#eff2f0]">
            <button
              type="button"
              className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              type="button"
              className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-transparent rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-white bg-[#147b58] shadow-[0_1px_2px_rgba(16,105,72,0.12)] transition hover:not-disabled:bg-[#106e4e] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              onClick={submit}
              disabled={busy}
            >
              {busy ? (
                <span className="w-3.5 h-3.5 inline-block border-2 border-white/45 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name="check" size={17} /> Create loan
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentForm({ loans, initialLoan, onSave, onCancel }) {
  const [form, setForm] = useState({
    loanId: initialLoan?._id || "",
    amount: "",
    paymentType: "principal",
    paymentDate: today(),
    notes: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({ ...form, amount: Number(form.amount) });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="px-[25px] pt-[23px] pb-[21px] max-[420px]:px-4 max-[420px]:pt-5 max-[420px]:pb-[17px]">
      <div className="relative mb-[17px]">
        <div className="mb-1.5 text-[#84938a] text-[9px] max-[650px]:text-[10px] tracking-[1.25px] font-bold">
          PAYMENT
        </div>
        <h2 className="m-0 text-[#24352b] text-[18px] max-[650px]:text-[20px] tracking-[-0.4px] font-bold">
          Record a payment
        </h2>
        <p className="mt-1.5 mb-0 text-[#909b94] text-[10px] max-[650px]:text-[11px]">
          Add a payment received from a customer.
        </p>
        <button
          className="absolute top-0 right-0 grid place-items-center p-[5px] border-0 rounded-[5px] text-[#87928b] bg-transparent hover:bg-[#f3f6f4] transition cursor-pointer"
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>
      {error && (
        <div
          className="my-3 px-2.5 py-[9px] border border-[#f1dddd] rounded-[5px] text-[#a04e4e] bg-[#fff8f8] text-[9px] leading-relaxed"
          role="alert"
        >
          {error}
        </div>
      )}
      <form className="grid gap-[13px]" onSubmit={submit}>
        <Field label="Loan">
          <select
            required
            value={form.loanId}
            onChange={(event) =>
              setForm({ ...form, loanId: event.target.value })
            }
          >
            <option value="">Select a loan</option>
            {loans
              .filter((loan) => loan.status !== "completed")
              .map((loan) => (
                <option key={loan._id} value={loan._id}>
                  {loan.loanId} · {loan.customerId?.name} ·{" "}
                  {currency(loan.principalAmount)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Payment amount">
          <div className="relative [&_input]:pl-[25px]">
            <span className="absolute top-1/2 left-[10px] -translate-y-1/2 text-[#8c9991] text-[10px] font-medium pointer-events-none">
              ₹
            </span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm({ ...form, amount: event.target.value })
              }
              placeholder="0.00"
            />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3 max-[420px]:gap-2">
          <Field label="Payment type">
            <select
              value={form.paymentType}
              onChange={(event) =>
                setForm({ ...form, paymentType: event.target.value })
              }
            >
              <option value="principal">Principal</option>
              <option value="interest">Interest</option>
            </select>
          </Field>
          <Field label="Payment date">
            <input
              required
              type="date"
              max={today()}
              value={form.paymentDate}
              onChange={(event) =>
                setForm({ ...form, paymentDate: event.target.value })
              }
            />
          </Field>
        </div>
        <Field label="Notes · optional">
          <textarea
            rows="2"
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            placeholder="Add a note about this payment"
          />
        </Field>
        <div className="flex justify-between gap-2.5 mt-1.5 pt-3.5 border-t border-[#eff2f0]">
          <button
            type="button"
            className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-transparent rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-white bg-[#147b58] shadow-[0_1px_2px_rgba(16,105,72,0.12)] transition hover:not-disabled:bg-[#106e4e] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            disabled={busy}
          >
            {busy ? (
              <span className="w-3.5 h-3.5 inline-block border-2 border-white/45 border-t-white rounded-full animate-spin" />
            ) : (
              "Save payment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function LoanDetails({ loan, onClose }) {
  const outstanding =
    loan.calculation?.totalOutstanding ?? loan.principalAmount;
  return (
    <div className="px-[25px] pt-[23px] pb-[21px] max-[420px]:px-4 max-[420px]:pt-5 max-[420px]:pb-[17px]">
      <div className="relative mb-[17px]">
        <div className="mb-1.5 text-[#84938a] text-[9px] max-[650px]:text-[10px] tracking-[1.25px] font-bold">
          {loan.loanId}
        </div>
        <h2 className="m-0 text-[#24352b] text-[18px] max-[650px]:text-[20px] tracking-[-0.4px] font-bold">
          Loan details
        </h2>
        <p className="mt-1.5 mb-0 text-[#909b94] text-[10px] max-[650px]:text-[11px]">
          Created {shortDate(loan.createdAt)}
        </p>
        <button
          className="absolute top-0 right-0 grid place-items-center p-[5px] border-0 rounded-[5px] text-[#87928b] bg-transparent hover:bg-[#f3f6f4] transition cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="flex items-center justify-between my-4 p-[15px] border border-[#e9f0eb] rounded-[7px] bg-[#f8fbf9]">
        <div className="grid gap-1">
          <span className="text-[#8b9790] text-[9px] max-[650px]:text-[10px]">
            Principal amount
          </span>
          <strong className="text-[#1e6f4b] text-[20px] max-[650px]:text-[22px] font-bold">
            {currency(loan.principalAmount)}
          </strong>
        </div>
        <StatusBadge status={loan.status} />
      </div>
      <div className="flex items-center gap-3 mb-4 p-3 border border-[#e9f0eb] rounded-[7px] bg-white">
        {loan.customerId?.photo ? (
          <img
            src={loan.customerId.photo}
            alt={`${loan.customerId.name || "Customer"} profile`}
            className="w-12 h-12 rounded-full object-cover border border-[#e9f0eb]"
          />
        ) : (
          <span className="grid place-items-center w-12 h-12 rounded-full text-[#167b57] bg-[#eaf6ef] text-[18px] font-bold">
            {(loan.customerId?.name || "C").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="grid gap-1">
          <strong className="text-[#304239] text-[12px]">{loan.customerId?.name || "Customer"}</strong>
          <span className="text-[#849087] text-[10px]">{loan.customerId?.phone || "No phone number"}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 pt-[5px] pb-[15px]">
        <Detail
          label="Interest rate"
          value={`${loan.interestRate}% ${
            loan.interestType === "monthly" ? "monthly" : "annually"
          }`}
        />
        <Detail label="Start date" value={shortDate(loan.startDate)} />
        <Detail label="Due date" value={shortDate(loan.dueDate)} />
        <Detail label="Duration" value={loan.duration || "—"} />
        <Detail
          label="Interest accrued"
          value={currency(loan.calculation?.accumulatedInterest)}
        />
        <Detail label="Outstanding total" value={currency(outstanding)} />
        <Detail label="Pledged property" value={loan.propertyId?.name} />
      </div>
      {loan.notes && (
        <div className="py-[11px] border-t border-[#eff2f0]">
          <span className="text-[#9aa39e] text-[9px] max-[650px]:text-[10px]">
            Notes
          </span>
          <p className="mt-[5px] mb-0 text-[#5d6a61] text-[9px] max-[650px]:text-[11px] leading-[1.6]">
            {loan.notes}
          </p>
        </div>
      )}
      {loan.propertyId?.images?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2 [&_img]:w-[84px] [&_img]:h-[65px] [&_img]:rounded-[5px] [&_img]:object-cover">
          {loan.propertyId.images.map((image) => (
            <img src={image} alt={loan.propertyId.name} key={image} />
          ))}
        </div>
      )}
      <div className="flex justify-between gap-2.5 mt-1.5 pt-3.5 border-t border-[#eff2f0]">
        <button
          type="button"
          className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
          onClick={() => printLoanReceipt(loan)}
        >
          Print receipt
        </button>
        <button
          type="button"
          className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function EditLoan({ loan, onSave, onCancel }) {
  const [form, setForm] = useState({
    principalAmount: loan.principalAmount,
    interestRate: loan.interestRate,
    interestType: loan.interestType,
    dueDate: loan.dueDate?.slice(0, 10) || "",
    duration: loan.duration || "",
    notes: loan.notes || "",
    status: loan.status === "overdue" ? "active" : loan.status,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave({
        ...form,
        principalAmount: Number(form.principalAmount),
        interestRate: Number(form.interestRate),
      });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="px-[25px] pt-[23px] pb-[21px] max-[420px]:px-4 max-[420px]:pt-5 max-[420px]:pb-[17px]">
      <div className="relative mb-[17px]">
        <div className="mb-1.5 text-[#84938a] text-[9px] max-[650px]:text-[10px] tracking-[1.25px] font-bold">
          {loan.loanId}
        </div>
        <h2 className="m-0 text-[#24352b] text-[18px] max-[650px]:text-[20px] tracking-[-0.4px] font-bold">
          Edit loan
        </h2>
        <p className="mt-1.5 mb-0 text-[#909b94] text-[10px] max-[650px]:text-[11px]">
          Update the loan terms, due date or status.
        </p>
        <button
          className="absolute top-0 right-0 grid place-items-center p-[5px] border-0 rounded-[5px] text-[#87928b] bg-transparent hover:bg-[#f3f6f4] transition cursor-pointer"
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>
      {error && (
        <div className="my-3 px-2.5 py-[9px] border border-[#f1dddd] rounded-[5px] text-[#a04e4e] bg-[#fff8f8] text-[9px] leading-relaxed">
          {error}
        </div>
      )}
      <form className="grid gap-[13px]" onSubmit={submit}>
        <Field label="Principal amount">
          <div className="relative [&_input]:pl-[25px]">
            <span className="absolute top-1/2 left-[10px] -translate-y-1/2 text-[#8c9991] text-[10px] font-medium pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={form.principalAmount}
              onChange={(e) =>
                setForm({ ...form, principalAmount: e.target.value })
              }
            />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3 max-[420px]:gap-2">
          <Field label="Interest rate">
            <div className="relative [&_input]:pr-[25px]">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={form.interestRate}
                onChange={(e) =>
                  setForm({ ...form, interestRate: e.target.value })
                }
              />
              <span className="absolute top-1/2 right-[10px] -translate-y-1/2 text-[#8c9991] text-[10px] font-medium pointer-events-none">
                %
              </span>
            </div>
          </Field>
          <Field label="Interest type">
            <select
              value={form.interestType}
              onChange={(e) =>
                setForm({ ...form, interestType: e.target.value })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </Field>
        </div>
        <Field label="Due date">
          <input
            type="date"
            required
            min={loan.startDate?.slice(0, 10)}
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </Field>
        <Field label="Duration">
          <input
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div className="flex justify-between gap-2.5 mt-1.5 pt-3.5 border-t border-[#eff2f0]">
          <button
            type="button"
            className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-transparent rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-white bg-[#147b58] shadow-[0_1px_2px_rgba(16,105,72,0.12)] transition hover:not-disabled:bg-[#106e4e] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            disabled={busy}
          >
            {busy ? (
              <span className="w-3.5 h-3.5 inline-block border-2 border-white/45 border-t-white rounded-full animate-spin" />
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditCustomer({ customer, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email || "",
    address: customer.address,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="px-[25px] pt-[23px] pb-[21px] max-[420px]:px-4 max-[420px]:pt-5 max-[420px]:pb-[17px]">
      <div className="relative mb-[17px]">
        <div className="mb-1.5 text-[#84938a] text-[9px] max-[650px]:text-[10px] tracking-[1.25px] font-bold">
          CUSTOMER PROFILE
        </div>
        <h2 className="m-0 text-[#24352b] text-[18px] max-[650px]:text-[20px] tracking-[-0.4px] font-bold">
          Edit customer
        </h2>
        <p className="mt-1.5 mb-0 text-[#909b94] text-[10px] max-[650px]:text-[11px]">
          Update this customer’s contact information.
        </p>
        <button
          className="absolute top-0 right-0 grid place-items-center p-[5px] border-0 rounded-[5px] text-[#87928b] bg-transparent hover:bg-[#f3f6f4] transition cursor-pointer"
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>
      {error && (
        <div className="my-3 px-2.5 py-[9px] border border-[#f1dddd] rounded-[5px] text-[#a04e4e] bg-[#fff8f8] text-[9px] leading-relaxed">
          {error}
        </div>
      )}
      <form className="grid gap-[13px]" onSubmit={submit}>
        <Field label="Full name">
          <input
            required
            minLength="2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Phone number">
          <input
            required
            type="tel"
            pattern="[+0-9 ()-]{8,20}"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Email address">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Full address">
          <textarea
            required
            rows="3"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <div className="flex justify-between gap-2.5 mt-1.5 pt-3.5 border-t border-[#eff2f0]">
          <button
            type="button"
            className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-transparent rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-white bg-[#147b58] shadow-[0_1px_2px_rgba(16,105,72,0.12)] transition hover:not-disabled:bg-[#106e4e] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            disabled={busy}
          >
            {busy ? (
              <span className="w-3.5 h-3.5 inline-block border-2 border-white/45 border-t-white rounded-full animate-spin" />
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CustomerDetails({ customer, loans, onClose, onViewLoan }) {
  return (
    <div className="px-[25px] pt-[23px] pb-[21px] max-[420px]:px-4 max-[420px]:pt-5 max-[420px]:pb-[17px]">
      <div className="relative mb-[17px]">
        <div className="mb-1.5 text-[#84938a] text-[9px] max-[650px]:text-[10px] tracking-[1.25px] font-bold">
          CUSTOMER PROFILE
        </div>
        <h2 className="m-0 text-[#24352b] text-[18px] max-[650px]:text-[20px] tracking-[-0.4px] font-bold">
          {customer.name}
        </h2>
        <p className="mt-1.5 mb-0 text-[#909b94] text-[10px] max-[650px]:text-[11px]">
          Customer since {shortDate(customer.createdAt)}
        </p>
        <button
          className="absolute top-0 right-0 grid place-items-center p-[5px] border-0 rounded-[5px] text-[#87928b] bg-transparent hover:bg-[#f3f6f4] transition cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 pt-[5px] pb-[15px] mt-[17px] [&>*:last-child]:col-span-2">
        <Detail label="Phone" value={customer.phone} />
        <Detail label="Email" value={customer.email} />
        <Detail label="Address" value={customer.address} />
      </div>
      <div className="flex items-center justify-between pt-[13px] pb-[9px] border-t border-[#eff2f0]">
        <h3 className="m-0 text-[#47574d] text-[10px] max-[650px]:text-[11px] font-semibold">
          Loans & pledged property
        </h3>
        <span className="text-[#89948d] text-[8px] max-[650px]:text-[10px]">
          {loans.length} {loans.length === 1 ? "loan" : "loans"}
        </span>
      </div>
      {loans.length ? (
        <div className="border border-[#edf1ee] rounded-[6px] overflow-hidden">
          {loans.map((loan) => (
            <button
              key={loan._id}
              onClick={() => onViewLoan(loan)}
              className="w-full flex justify-between gap-3 p-2.5 border-0 border-b border-[#eff2f0] last:border-b-0 bg-white text-left hover:bg-[#fbfcfb] transition cursor-pointer"
            >
              <span className="grid gap-1">
                <strong className="text-[#405046] text-[9px] max-[650px]:text-[11px] font-semibold">
                  {loan.propertyId?.name || loan.loanId}
                </strong>
                <small className="text-[#929d96] text-[8px] max-[650px]:text-[10px]">
                  {loan.loanId} · {shortDate(loan.startDate)}
                </small>
              </span>
              <span className="flex items-center gap-2 text-[#407958] text-[9px] max-[650px]:text-[11px] font-semibold whitespace-nowrap">
                {currency(loan.principalAmount)}
                <Icon name="arrow" size={15} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-[13px] border border-dashed border-[#e6ece8] rounded-[6px] text-[#939e97] text-center text-[9px] max-[650px]:text-[11px]">
          No loans associated with this customer.
        </div>
      )}
      <div className="flex justify-between gap-2.5 mt-1.5 pt-3.5 border-t border-[#eff2f0]">
        <button
          type="button"
          className="min-h-[37px] max-[650px]:min-h-[42px] inline-flex items-center justify-center gap-2 px-[13px] py-0 border border-[#e2e8e4] rounded-[6px] text-[10px] max-[650px]:text-[11px] font-semibold text-[#45554c] bg-white transition hover:border-[#cbd9d1] hover:bg-[#fbfdfb] active:translate-y-[1px] cursor-pointer"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
