import Link from "next/link";
import { EmptyPanel } from "../dashboard/EmptyPanel";
import { StatusBadge } from "../site/StatusBadge";

const CHANNELS = [
  { name: "Online store", state: "soon" as const },
  { name: "Social store", state: "soon" as const },
  { name: "Marketplace connector", state: "soon" as const },
  { name: "Discover merchants", state: "soon" as const },
];

const SOCIAL = [
  { label: "WhatsApp", url: "https://wa.me/?text=Shop%20on%20Kan" },
  { label: "Facebook", url: "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fkan-sme.vercel.app%2Fshop%2Fdemo-duuka" },
];

export function ChannelsPanel() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">Channels</h1>
          <StatusBadge state="soon" />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          One catalogue, every place your customers find you.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div
            key={channel.name}
            className="card flex min-h-11 items-center justify-between gap-2"
          >
            <span className="text-sm font-semibold">{channel.name}</span>
            <StatusBadge state={channel.state} />
          </div>
        ))}
      </div>

      <EmptyPanel
        title="Share your storefront"
        message="Public catalogue sharing and online orders are coming soon. The storefront preview uses books on this device only."
        state="soon"
        action={
          <div className="flex flex-wrap gap-2">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        }
      />

      <EmptyPanel
        title="Discover merchants"
        message="Browse the preview directory of shops on this device."
        state="soon"
        action={
          <Link href="/discover" className="btn-secondary text-sm">
            Open directory
          </Link>
        }
      />
    </div>
  );
}
