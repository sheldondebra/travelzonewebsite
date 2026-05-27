"use client";

import { Loader2, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DeliveryDetails } from "@/lib/orders/delivery";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Suggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  latitude?: number;
  longitude?: number;
  provider: "google" | "nominatim";
};

type PlaceDetails = {
  formattedAddress: string;
  address: string;
  city?: string;
  region?: string;
  latitude: number;
  longitude: number;
  placeId: string;
};

type Props = {
  value: string;
  disabled?: boolean;
  onSelect: (patch: Partial<DeliveryDetails>) => void;
  onManualChange: (address: string) => void;
  className?: string;
};

export function DeliveryAddressAutocomplete({
  value,
  disabled,
  onSelect,
  onManualChange,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [provider, setProvider] = useState<"google" | "nominatim">("google");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input.trim())}`,
      );
      const data = await parseApiResponse<{
        suggestions: Suggestion[];
        provider: "google" | "nominatim";
      }>(res);
      setSuggestions(data.suggestions);
      setProvider(data.provider);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function pickSuggestion(s: Suggestion) {
    setOpen(false);
    setLoading(true);
    try {
      let details: PlaceDetails;
      if (s.provider === "nominatim" && s.latitude != null && s.longitude != null) {
        const res = await fetch(
          `/api/places/details?provider=nominatim&lat=${s.latitude}&lon=${s.longitude}`,
        );
        details = await parseApiResponse<PlaceDetails>(res);
      } else {
        const res = await fetch(
          `/api/places/details?placeId=${encodeURIComponent(s.placeId)}&provider=${s.provider}`,
        );
        details = await parseApiResponse<PlaceDetails>(res);
      }

      onSelect({
        address: details.address,
        formattedAddress: details.formattedAddress,
        city: details.city,
        region: details.region,
        latitude: details.latitude,
        longitude: details.longitude,
        placeId: details.placeId,
      });
    } catch {
      onSelect({ address: s.mainText, formattedAddress: s.description });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
        />
        <input
          type="text"
          disabled={disabled}
          value={value}
          placeholder="Start typing address — pick from suggestions"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-10 text-sm shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 disabled:opacity-50"
          onChange={(e) => {
            const v = e.target.value;
            onManualChange(v);
            setOpen(true);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => fetchSuggestions(v), 320);
          }}
          onFocus={() => {
            if (value.trim().length >= 3) setOpen(true);
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={`${s.provider}-${s.placeId}`}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-brand-rose/30"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(s)}
              >
                <span className="font-medium">{s.mainText}</span>
                {s.secondaryText && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {s.secondaryText}
                  </span>
                )}
              </button>
            </li>
          ))}
          <li className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-muted-foreground">
            {provider === "google" ? "Google Places" : "OpenStreetMap"} suggestions
          </li>
        </ul>
      )}
    </div>
  );
}
