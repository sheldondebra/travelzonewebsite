import { Badge } from "@/components/ui/badge";
import {
  itemCountSummary,
  orderItemsDisplay,
  summarizeOrderItems,
  type OrderItemLike,
} from "@/lib/orders/format";

export function OrderItemsBadge({ items }: { items: OrderItemLike[] }) {
  const { quantity } = summarizeOrderItems(items);
  if (quantity === 0) return null;

  return (
    <Badge variant="secondary" className="tabular-nums font-normal">
      {itemCountSummary(items)}
    </Badge>
  );
}

export function OrderItemsCell({ items }: { items: OrderItemLike[] }) {
  const { headline, detail } = orderItemsDisplay(items);
  const { quantity } = summarizeOrderItems(items);

  if (quantity === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-[140px] max-w-[220px]">
      <p className="truncate text-sm font-medium text-foreground" title={headline}>
        {headline}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}

export function OrderItemsInline({ items }: { items: OrderItemLike[] }) {
  const { headline, detail } = orderItemsDisplay(items);

  return (
    <span className="text-xs text-muted-foreground">
      {detail ?? headline}
    </span>
  );
}
