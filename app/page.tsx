import MarketplacePage from "@/components/marketplace/MarketplacePage";
import {
  getMarketplaceCards,
  getMarketplaceStats,
} from "@/lib/api/marketplace";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cards = await getMarketplaceCards();
  const stats = await getMarketplaceStats(cards);

  return <MarketplacePage cards={cards} stats={stats} />;
}
