import { StockList } from "@/components/dashboard/stock-list";
import { getStockItems } from "@/app/actions/stock";

export default async function StockPage() {
  const stockItems = await getStockItems();
  return (
    <div>
      <StockList initialStockItems={stockItems} />
    </div>
  );
}
