import MarketplacePage from "@/components/marketplace/MarketplacePage";
import {
  getMarketplaceCards,
  getMarketplaceStats,
  getTrendingCards,
} from "@/lib/api/marketplace";

export const revalidate = 60;

export default async function HomePage() {
  const [cards, trendingCards] = await Promise.all([
    getMarketplaceCards(),
    getTrendingCards(6),
  ]);
  const stats = await getMarketplaceStats(cards);

  return <MarketplacePage stats={stats} trendingCards={trendingCards} />;
}
