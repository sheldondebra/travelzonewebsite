"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveTourAction } from "@/app/admin/actions/tours";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminTour, ContentStatus } from "@/lib/content-types";
import { slugify } from "@/lib/slugify";

type Props = {
  tour?: AdminTour;
};

function linesToArray(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(values: string[]) {
  return values.filter(Boolean).join("\n");
}

function collectLibraryImages(tour?: AdminTour) {
  const urls = new Set<string>();
  if (tour?.image) urls.add(tour.image);
  tour?.gallery?.forEach((url) => urls.add(url));
  return Array.from(urls);
}

export function TourForm({ tour }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(tour?.title ?? "");
  const [tagline, setTagline] = useState(tour?.tagline ?? "");
  const [location, setLocation] = useState(tour?.location ?? "");
  const [duration, setDuration] = useState(tour?.duration ?? "");
  const [price, setPrice] = useState(String(tour?.price ?? ""));
  const [currency, setCurrency] = useState<"USD" | "GHS">(
    tour?.currency ?? "USD",
  );
  const [priceNote, setPriceNote] = useState(tour?.priceNote ?? "");
  const [travelPeriod, setTravelPeriod] = useState(tour?.travelPeriod ?? "");
  const [description, setDescription] = useState(tour?.description ?? "");
  const [highlightsText, setHighlightsText] = useState(
    arrayToLines(tour?.highlights ?? []),
  );
  const [includedText, setIncludedText] = useState(
    arrayToLines(tour?.included ?? []),
  );
  const [overviewText, setOverviewText] = useState(
    arrayToLines(tour?.overview ?? []),
  );
  const [category, setCategory] = useState(tour?.category ?? "");
  const [status, setStatus] = useState<ContentStatus>(
    tour?.status ?? "draft",
  );
  const [featuredImage, setFeaturedImage] = useState(tour?.image ?? "");
  const [gallery, setGallery] = useState<string[]>(tour?.gallery ?? []);
  const [libraryImages, setLibraryImages] = useState<string[]>(() =>
    collectLibraryImages(tour),
  );

  const slug = useMemo(() => slugify(title) || "tour", [title]);
  const uploadFolder = useMemo(() => `tours/${slug}`, [slug]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveTourAction(formData);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="admin-editor-layout">
      {tour?.id ? <input type="hidden" name="id" value={tour.id} /> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="image" value={featuredImage} />
      <input type="hidden" name="gallery" value={JSON.stringify(gallery)} />
      <input
        type="hidden"
        name="overview"
        value={JSON.stringify(linesToArray(overviewText))}
      />
      <input
        type="hidden"
        name="highlights"
        value={JSON.stringify(linesToArray(highlightsText))}
      />
      <input
        type="hidden"
        name="included"
        value={JSON.stringify(linesToArray(includedText))}
      />

      <div className="admin-editor-main space-y-5">
        {error ? <AdminNotice variant="error">{error}</AdminNotice> : null}

        <div className="admin-postbox">
          <div className="admin-postbox-body space-y-4">
            <div>
              <label htmlFor="title" className="admin-label">
                Tour name
              </label>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="e.g. Dubai Summer Getaway"
                className="admin-input admin-input-title"
              />
              <p className="mt-1 text-[12px] text-[#646970]">
                Link: /tours/{slug}
              </p>
            </div>

            <div>
              <label htmlFor="tagline" className="admin-label">
                Tagline
              </label>
              <input
                id="tagline"
                name="tagline"
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="Short hook shown on tour cards"
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="description" className="admin-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Brief summary for the tour page"
                className="admin-input"
              />
            </div>
          </div>
        </div>

        <AdminWidget title="Photos">
          <MediaLibrary
            folder={uploadFolder}
            images={libraryImages}
            onImagesChange={setLibraryImages}
            featuredImage={featuredImage}
            onFeaturedChange={setFeaturedImage}
            gallery={gallery}
            onGalleryChange={setGallery}
          />
        </AdminWidget>

        <AdminWidget title="Trip details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="location" className="admin-label">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Dubai, UAE"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="duration" className="admin-label">
                Duration
              </label>
              <input
                id="duration"
                name="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="e.g. 5 days / 4 nights"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="category" className="admin-label">
                Category
              </label>
              <input
                id="category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="e.g. International"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="travelPeriod" className="admin-label">
                Travel period
              </label>
              <input
                id="travelPeriod"
                name="travelPeriod"
                value={travelPeriod}
                onChange={(event) => setTravelPeriod(event.target.value)}
                placeholder="e.g. June – August 2026"
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>

        <AdminWidget title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="price" className="admin-label">
                Price
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                placeholder="0.00"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="currency" className="admin-label">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value as "USD" | "GHS")
                }
                className="admin-input"
              >
                <option value="USD">USD</option>
                <option value="GHS">GHS</option>
              </select>
            </div>
            <div>
              <label htmlFor="priceNote" className="admin-label">
                Price note
              </label>
              <input
                id="priceNote"
                name="priceNote"
                value={priceNote}
                onChange={(event) => setPriceNote(event.target.value)}
                placeholder="e.g. per person sharing"
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>

        <AdminWidget title="Highlights">
          <label htmlFor="highlights" className="admin-label">
            One highlight per line
          </label>
          <textarea
            id="highlights"
            rows={4}
            value={highlightsText}
            onChange={(event) => setHighlightsText(event.target.value)}
            placeholder={"Desert safari\nBurj Khalifa visit\nHotel breakfast included"}
            className="admin-input"
          />
        </AdminWidget>

        <AdminWidget title="Included">
          <label htmlFor="included" className="admin-label">
            One item per line
          </label>
          <textarea
            id="included"
            rows={4}
            value={includedText}
            onChange={(event) => setIncludedText(event.target.value)}
            placeholder={"Return flights\n4-star hotel\nAirport transfers"}
            className="admin-input"
          />
        </AdminWidget>

        <AdminWidget title="Overview">
          <label htmlFor="overview" className="admin-label">
            One paragraph per line
          </label>
          <textarea
            id="overview"
            rows={4}
            value={overviewText}
            onChange={(event) => setOverviewText(event.target.value)}
            placeholder="Optional longer paragraphs for the tour page"
            className="admin-input"
          />
        </AdminWidget>
      </div>

      <div className="admin-editor-sidebar space-y-5">
        <AdminWidget title="Publish">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#646970]">Status</span>
              <StatusBadge status={status} />
            </div>

            <div>
              <label htmlFor="status" className="admin-label">
                Visibility
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ContentStatus)
                }
                className="admin-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#f0f0f1] pt-3">
              <button
                type="submit"
                disabled={pending}
                className="admin-button-primary"
              >
                {pending
                  ? "Saving…"
                  : status === "published"
                    ? tour
                      ? "Update"
                      : "Publish"
                    : "Save draft"}
              </button>
              {tour && status === "published" && slug ? (
                <Link
                  href={`/tours/${slug}`}
                  target="_blank"
                  className="admin-button-secondary"
                >
                  Preview
                </Link>
              ) : null}
            </div>
          </div>
        </AdminWidget>
      </div>
    </form>
  );
}
