import { LegalPage } from "../../components/site/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="General terms of use"
      intro="These terms govern use of the Kan website and dashboard. The till is provided as-is while the platform is being built."
      sections={[
        {
          heading: "Using the site",
          body: "You may browse this site and use the dashboard preview. Feature states are shown honestly: Available now, Coming soon and With partner. Nothing on this site is a guarantee of a future feature or date.",
        },
        {
          heading: "Your records",
          body: "You are responsible for the accuracy of prices, stock counts and customer balances entered into the till. Export a backup regularly — local browser data can be lost.",
        },
        {
          heading: "No financial service today",
          body: "Kan does not hold money, provide banking, or process payments in the current release. Banking and crypto features, if offered, will be provided through licensed partners and governed by their terms.",
        },
        {
          heading: "Availability",
          body: "The till works offline. The website and dashboard may be updated or unavailable while the platform is developed.",
        },
        {
          heading: "Changes",
          body: "These terms may change as features are added. Material changes will be published on this page before they take effect.",
        },
      ]}
    />
  );
}
