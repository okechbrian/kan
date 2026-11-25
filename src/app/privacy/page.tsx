import { LegalPage } from "../../components/site/LegalPage";
import { PWATA_CONTACT } from "../../lib/platform/pricing";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`This privacy policy explains how ${PWATA_CONTACT.entity} ("Kan is a product of ${PWATA_CONTACT.entity}") collects, stores and protects shop and personal data in line with Uganda's Data Protection and Privacy Act, 2019.`}
      sections={[
        {
          heading: "Data controller",
          body: `${PWATA_CONTACT.entity}, located at ${PWATA_CONTACT.address}. Privacy inquiries may be sent to ${PWATA_CONTACT.email} or ${PWATA_CONTACT.phoneDisplay}.`,
        },
        {
          heading: "What is stored locally on the till",
          body: "The offline till stores business records — products, sales, customers and shifts — directly on your device so you can trade without internet. Attendants sign in with a PIN and never require an email address.",
        },
        {
          heading: "Why we ask for a phone number",
          body: "Customer phone numbers are optional and used to identify credit (deni) accounts, send digital receipts, or confirm storefront orders. Merchant phone numbers (+256) are used for account verification and support.",
        },
        {
          heading: "Cloud sync & tenant isolation",
          body: "When cloud sync is connected, records sync only to your shop's isolated workspace. Staff permissions scope access by role and assigned branch.",
        },
        {
          heading: "Backups & third parties",
          body: "You can export a JSON backup anytime. Payment gateways or messaging providers used on paid plans are named before activation and never receive card numbers from Kan.",
        },
        {
          heading: "Retention, access & deletion",
          body: "Active account data is removed within 90 days of verified closure; statutory transaction records may be retained up to 7 years. Submit requests via the Account Deletion page.",
        },
      ]}
    />
  );
}
