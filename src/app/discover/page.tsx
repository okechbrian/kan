import { DirectoryView } from "../../components/channels/DirectoryView";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SiteHeader } from "../../components/site/SiteHeader";

export const metadata = { title: "Discover merchants" };

export default function DiscoverPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <p className="eyebrow">Discover</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Find businesses powered by Kan.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
          Browse shops, pharmacies, restaurants and service businesses — then shop
          directly from them.
        </p>
        <DirectoryView />
      </main>
      <SiteFooter />
    </>
  );
}
