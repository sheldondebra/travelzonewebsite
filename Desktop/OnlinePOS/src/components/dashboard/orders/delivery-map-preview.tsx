"use client";

import { ExternalLink, MapPin } from "lucide-react";
import type { DeliveryDetails } from "@/lib/orders/delivery";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsUrl,
  formatDeliveryAddressLine,
} from "@/lib/orders/delivery-maps";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  delivery: DeliveryDetails;
  className?: string;
};

export function DeliveryMapPreview({ delivery, className }: Props) {
  const mapsUrl = buildGoogleMapsUrl(delivery);
  const embedUrl = buildGoogleMapsEmbedUrl(delivery);
  const line = formatDeliveryAddressLine(delivery);
  const hasLocation =
    (delivery.latitude != null && delivery.longitude != null) ||
    Boolean(line.replace(/,?\s*Ghana/gi, "").trim());

  if (!hasLocation) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-sky-50/50 to-white",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        {embedUrl && (
          <div className="relative h-40 w-full shrink-0 bg-muted/30 sm:h-auto sm:min-h-[10.5rem] sm:w-60 md:w-72">
            <iframe
              title="Delivery location map"
              src={embedUrl}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Confirmed location
              </p>
              <p className="text-sm font-medium leading-snug line-clamp-3">{line}</p>
              {delivery.latitude != null && delivery.longitude != null && (
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {delivery.latitude.toFixed(5)}, {delivery.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "outline",
              className: "shrink-0 rounded-xl border-gray-200",
            })}
          >
            <ExternalLink className="mr-2 size-4" />
            Open in Maps
          </a>
        </div>
      </div>
    </div>
  );
}
