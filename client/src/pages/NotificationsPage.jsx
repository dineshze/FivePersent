import { tw } from "../lib/tailwindStyles.js";
import { EmptyState, PageHeading } from "../components/ui.jsx";

export function NotificationsPage() {
  return (
    <>
      <PageHeading
        eyebrow="UPDATES"
        title="Notifications"
        description="Important updates about your workspace will appear here."
      />
      <section className={tw("panel")}>
        <EmptyState
          icon="bell"
          title="You're all caught up"
          description="There are no notifications right now."
        />
      </section>
    </>
  );
}
