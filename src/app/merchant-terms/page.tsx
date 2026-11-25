import { LegalPage } from "../../components/site/LegalPage";
import { PWATA_CONTACT } from "../../lib/platform/pricing";

export default function MerchantTermsPage() {
  return (
    <LegalPage
      title="Merchant terms of use"
      intro={`These merchant terms apply when a business uses Kan (a product of ${PWATA_CONTACT.entity}) to manage counter sales, inventory, branches, or an online storefront.`}
      sections={[
        {
          heading: "Your shop, your books",
          body: "Merchants remain solely responsible for product pricing, stock accuracy, consumer disclosures, delivery fulfilment and Ugandan tax compliance (including URA obligations where applicable).",
        },
        {
          heading: "Branch & tenant isolation",
          body: "Each shop has independent stock movements, customer deni balances and shift registers. Devices paired to one shop cannot access another shop's books.",
        },
        {
          heading: "Online storefront & Discover directory",
          body: "Storefront listings must accurately represent available, unexpired goods and lawful services. Pwata Inc may suspend listings that mislead buyers or violate Ugandan law.",
        },
        {
          heading: "Payments & settlements",
          body: "Cash and manual mobile money confirmations are recorded directly by the merchant. Integrated payment gateways or collection APIs are governed by the licensed payment provider's terms; Kan never stores raw card details.",
        },
        {
          heading: "Exit & data portability",
          body: `You may export your shop books as JSON at any time and request closure via Account Deletion or ${PWATA_CONTACT.email}.`,
        },
      ]}
    />
  );
}
