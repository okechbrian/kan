export type Channel = "online_store" | "social_store" | "whatsapp" | "marketplace";

export type ChannelSyncItem = {
  channel: Channel;
  productId: string;
  status: "synced" | "pending" | "unavailable" | "out_of_stock";
  note?: string;
};

export function syncPlan(input: {
  productIds: string[];
  channels: Channel[];
  inStock: (id: string) => boolean;
  allowedChannels: Channel[];
}): ChannelSyncItem[] {
  const items: ChannelSyncItem[] = [];
  for (const channel of input.channels) {
    const allowed = input.allowedChannels.includes(channel);
    for (const productId of input.productIds) {
      items.push({
        channel,
        productId,
        status: !allowed
          ? "unavailable"
          : !input.inStock(productId)
            ? "out_of_stock"
            : "pending",
        note: !allowed
          ? "channel not enabled for this shop"
          : !input.inStock(productId)
            ? "hidden until stock returns"
            : "queued for sync",
      });
    }
  }
  return items;
}

export function unifiedOrders<T extends { source: string }>(orders: T[]) {
  return [...orders].sort((a, b) => a.source.localeCompare(b.source));
}
