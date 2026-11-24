import { LegalPage } from "../../components/site/LegalPage";

export default function MerchantTermsPage() {
  return (
    <LegalPage
      title="Merchant terms"
      intro="These terms apply when a shop uses Kan to run its books, and later to sell through a storefront."
      sections={[
        {
          heading: "Your business, your books",
          body: "You remain responsible for your prices, stock, tax obligations and the accuracy of your records. Kan records what is entered; it does not file returns or calculate tax liability.",
        },
        {
          heading: "Shop data and separation",
          body: "Each shop has its own stock, credit customers and till. Data from one shop is never mixed with another. A device paired to one shop cannot read another shop's records.",
        },
        {
          heading: "Online store",
          body: "When the storefront opens, you are responsible for product information, delivery promises, returns and customer service. Digital receipts and invoices are generated from your own records.",
        },
        {
          heading: "Payments",
          body: "Payments will be processed by licensed providers. Kan does not store card details. Payment disputes and refunds follow the provider's rules and your own customer policy.",
        },
        {
          heading: "Suspension and exit",
          body: "You may export your records at any time. Account suspension and closure terms are published with billing; existing data remains exportable.",
        },
      ]}
    />
  );
}
