import { tw } from '../lib/tailwindStyles.js'
import { Icon } from "../components/Icon.jsx";
import { PageHeading } from "../components/ui.jsx";

export function SettingsPage({ user, onLogout }) {
  return (
    <>
      <PageHeading
        eyebrow="PREFERENCES"
        title="Settings"
        description="Manage your account and data privacy."
      />
      <section className={tw("panel settings-panel")}>
        <div className={tw("settings-title")}>
          <span className={tw("settings-icon")}>
            <Icon name="customers" size={20} />
          </span>
          <div>
            <h2>Account details</h2>
            <p>Your personal information and sign-in identity.</p>
          </div>
        </div>
        <div className={tw("settings-fields")}>
          <div>
            <span>Full name</span>
            <strong>{user?.name || "—"}</strong>
          </div>
          <div>
            <span>Email address</span>
            <strong>{user?.email || "—"}</strong>
          </div>
          <div>
            <span>Phone number</span>
            <strong>{user?.phone || "—"}</strong>
          </div>
        </div>
      </section>
      <section className={tw("panel settings-panel")}>
        <div className={tw("settings-title")}>
          <span className={tw("settings-icon privacy-icon")}>
            <Icon name="shield" size={20} />
          </span>
          <div>
            <h2>Privacy & security</h2>
            <p>
              Your account data is private to you. All records are scoped to
              your account.
            </p>
          </div>
        </div>
        <div className={tw("privacy-note")}>
          <Icon name="check" size={16} /> Authentication is secured with
          encrypted passwords and signed access tokens.
        </div>
      </section>
      <section className={tw("panel settings-panel logout-panel")}>
        <div>
          <h2>Sign out</h2>
          <p>Sign out of your account on this device.</p>
        </div>
        <button className={tw("button button-danger")} onClick={onLogout}>
          <Icon name="logout" size={17} /> Sign out
        </button>
      </section>
    </>
  );
}
