import { LegalPage } from "../../components/site/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This page explains what Kan does with shop and personal data. It is written for the current release, where the till works locally on a device."
      sections={[
        {
          heading: "What is stored today",
          body: "The till stores business records — products, sales, customers and shifts — in the browser on the device. These records stay on that device until sync is enabled. No account is required to use the till.",
        },
        {
          heading: "Why we ask for a phone number",
          body: "A customer phone number is optional and is used to identify a credit (deni) customer and, later, to send receipts or payment links. Attendants do not need an email address.",
        },
        {
          heading: "Cloud sync",
          body: "When sync is enabled, business records are sent to the shop's own cloud workspace. Only users attached to that business can read them. Sync never blocks selling offline.",
        },
        {
          heading: "Backups",
          body: "You can export your records as a JSON file at any time. Clearing browser data deletes the local books until a backup or sync exists — export regularly.",
        },
        {
          heading: "Third parties",
          body: "The current release does not embed third-party tracking. Payment, delivery and communication providers will be named here before those features are enabled.",
        },
        {
          heading: "Your choices",
          body: "You can export your data, and you can request deletion through the account deletion page. Until accounts are enabled, deletion is handled by clearing the device's local data after exporting a backup.",
        },
      ]}
    />
  );
}
