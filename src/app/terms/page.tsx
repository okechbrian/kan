import { LegalPage } from "../../components/site/LegalPage";
import { PWATA_CONTACT } from "../../lib/platform/pricing";

export default function TermsPage() {
  return (
    <LegalPage
      title="General terms of use"
      intro={`These terms govern use of the Kan website, dashboard and offline till provided by ${PWATA_CONTACT.entity} (${PWATA_CONTACT.address}).`}
      sections={[
        {
          heading: "Using Kan",
          body: "You may browse this website, run the offline till, and open a workspace. Feature states are labelled honestly as Available now, Coming soon, or With partner.",
        },
        {
          heading: "Your records & backups",
          body: "You are responsible for the accuracy of prices, stock counts, tax obligations and customer credit balances entered into Kan. Export a JSON backup regularly when operating offline.",
        },
        {
          heading: "No in-house banking or crypto custody",
          body: "Kan does not act as a bank, mobile money operator, or crypto custodian. Regulated financial services, if offered, are provided strictly through licensed partners under their own terms.",
        },
        {
          heading: "Subscription billing",
          body: "Plans are priced in integer UGX across Monthly, Quarterly, 6-Month and Yearly cycles. You may cancel prior to renewal and export your shop records anytime.",
        },
        {
          heading: "Governing law & contact",
          body: `These terms are governed by the laws of the Republic of Uganda. Contact ${PWATA_CONTACT.entity} at ${PWATA_CONTACT.email} or ${PWATA_CONTACT.phoneDisplay}.`,
        },
      ]}
    />
  );
}
