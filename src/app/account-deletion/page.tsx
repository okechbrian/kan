import { LegalPage } from "../../components/site/LegalPage";

export default function AccountDeletionPage() {
  return (
    <LegalPage
      title="Account deletion"
      intro="How to remove your data from Kan, today and when accounts are introduced."
      sections={[
        {
          heading: "Today: no account needed",
          body: "The till does not require an email or account. Your records live in this browser. Export a JSON backup first, then clear this site's data in your browser settings to remove them from the device.",
        },
        {
          heading: "With the platform release",
          body: "When accounts are enabled, an in-app request will delete your account, detach your devices and remove your business records after a short verification period.",
        },
        {
          heading: "What may be retained",
          body: "Transaction records required by law or by a payment provider may be retained for the period they require. Anything retained will be listed in the deletion confirmation.",
        },
        {
          heading: "Backups",
          body: "Deleting an account does not delete backups you downloaded yourself. Keep them private — they contain customer names and balances.",
        },
      ]}
    />
  );
}
