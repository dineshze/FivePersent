import { tw } from "../lib/tailwindStyles.js";
import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Field } from "../components/ui.jsx";
import { request } from "../lib/api.js";

export function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAuthenticated(result.token, result.user);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={tw("auth-page")}>
      <div className={tw("auth-brand")}>
        <span className={tw("brand-mark")}>
          <span />
        </span>
        <span className={tw("brand-name")}>
          five<span>percentage</span>
        </span>
      </div>
      <div className={tw("auth-layout")}>
        <section className={tw("auth-promo")}>
          <div className={tw("promo-orb orb-one")} />
          <div className={tw("promo-orb orb-two")} />
          <div className={tw("promo-content")}>
            <div className={tw("eyebrow")}>
              <span className={tw("eyebrow-dot")} /> MADE FOR YOUR BUSINESS
            </div>
            <h1>
              Clarity for every
              <br />
              <em>commitment.</em>
            </h1>
            <p>
              A simpler way to manage your loans, customers and payments — all
              in one place.
            </p>
            <div className={tw("promo-points")}>
              <span>
                <Icon name="check" size={16} /> Private by design
              </span>
              <span>
                <Icon name="check" size={16} /> Built for India
              </span>
            </div>
          </div>
          <div className={tw("promo-foot")}>
            <span>FINANCIAL CLARITY, EVERY DAY</span>
            <span>01 — 03</span>
          </div>
        </section>
        <section className={tw("auth-panel")}>
          <div className={tw("auth-form-wrap")}>
            <div className={tw("auth-mobile-title")}>
              Welcome to Five Percentage
            </div>
            <div className={tw("auth-heading")}>
              <h2>
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p>
                {mode === "login"
                  ? "Enter your details to sign in to your account."
                  : "Get started with a free, secure account."}
              </p>
            </div>
            {error && (
              <div className={tw("form-error")} role="alert">
                {error}
              </div>
            )}
            <form onSubmit={submit} className={tw("auth-form")}>
              {mode === "register" && (
                <>
                  <Field label="Full name">
                    <input
                      required
                      minLength="2"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. Ananya Sharma"
                    />
                  </Field>
                  <Field label="Phone number">
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      pattern="[+0-9 ()-]{8,20}"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                </>
              )}
              <Field label="Email address">
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </Field>
              <Field label="Password">
                <input
                  required
                  type="password"
                  minLength="8"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="At least 8 characters"
                />
              </Field>
              {mode === "login" && (
                <div className={tw("auth-options")}>
                  <label className={tw("checkbox-label")}>
                    <input type="checkbox" /> Remember me
                  </label>
                  <span>
                    Secure sign in <Icon name="shield" size={14} />
                  </span>
                </div>
              )}
              <button
                className={tw("button button-primary auth-submit")}
                disabled={busy}
              >
                {busy ? (
                  <span className={tw("spinner")} />
                ) : mode === "login" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
                {!busy && <Icon name="arrow" size={17} />}
              </button>
            </form>
            <div className={tw("auth-switch")}>
              {mode === "login"
                ? "New to Five Percentage?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </div>
            <div className={tw("auth-privacy")}>
              <Icon name="shield" size={15} /> Passwords are securely hashed.
              Your records stay private.
            </div>
          </div>
          <div className={tw("auth-copyright")}>
            © {new Date().getFullYear()} Five Percentage <span>·</span>{" "}
            Thoughtfully made for your business
          </div>
        </section>
      </div>
    </div>
  );
}
