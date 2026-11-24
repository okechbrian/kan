import { StorefrontView } from "../../../components/store/StorefrontView";

export const metadata = { title: "Storefront" };

export default function StorefrontPage({ params }: { params: { slug: string } }) {
  return <StorefrontView slug={params.slug} />;
}
