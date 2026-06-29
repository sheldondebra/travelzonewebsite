"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveTourAction } from "@/app/admin/actions/tours";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { ImageUpload } from "@/components/admin/ImageUpload";
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

function hasExtrasContent(
  highlights: string,
  included: string,
  overview: string,
) {
  return Boolean(highlights.trim() || included.trim() || overview.trim());
}

export function TourForm({ tour }: Props) {
  const isNew = !tour;
  const [state, formAction, pending] = useActionState(saveTourAction, undefined);

  const [title, setTitle] = useState(tour?.title ?? "");
  const [tagline, setTagline] = useState(tour?.tagline ?? "");
  const [location, setLocation] = useState(tour?.location ?? "");
  const [duration, setDuration] = useState(tour?.duration ?? "");
  const [price, setPrice] = useState(String(tour?.price ?? ""));
  const [currency, setCurrency] = useState<"USD" | "GHS">(
    tour?.currency ?? "USD",
  );
  const [priceNote, setPriceNote] = useState(
    tour?.priceNote ?? "per person (double sharing)",
  );
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
  const [category, setCategory] = useState(tour?.category ?? "International");
  const [status, setStatus] = useState<ContentStatus>(
    tour?.status ?? "draft",
  );
  const [featuredImage, setFeaturedImage] = useState(tour?.image ?? "");
  const [gallery, setGallery] = useState<string[]>(tour?.gallery ?? []);
  const [libraryImages, setLibraryImages] = useState<string[]>(() =>
    collectLibraryImages(tour),
  );
  const [showGallery, setShowGallery] = useState(
    () => !isNew && (tour?.gallery?.length ?? 0) > 0,
  );
  const [showExtras, setShowExtras] = useState(() =>
    isNew
      ? false
      : hasExtrasContent(
          arrayToLines(tour?.highlights ?? []),
          arrayToLines(tour?.included ?? []),
          arrayToLines(tour?.overview ?? []),
        ),
  );

  const slug = useMemo(() => slugify(title) || "tour", [title]);
  const uploadFolder = useMemo(() => `tours/${slug}`, [slug]);

  function handleFeaturedChange(url: string) {
    setFeaturedImage(url);
    if (!url) return;

    setLibraryImages((current) =>
      current.includes(url) ? current : [url, ...current],
    );
    setGallery((current) => (current.includes(url) ? current : [url, ...current]));
  }

  return (
    <form action={formAction} className="admin-editor-layout admin-tour-form">
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

      <div className="admin-editor-main space-y-4">
        {state && !state.success ? (
          <AdminNotice variant="error">{state.error}</AdminNotice>
        ) : null}

        <AdminWidget title="Basics">
          <div className="space-y-4">
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
                autoFocus={isNew}
                placeholder="Dubai Summer Getaway"
                className="admin-input admin-input-title"
              />
              <p className="admin-field-hint">travelzonegh.com/tours/{slug}</p>
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
                placeholder="A short hook for cards and the tour page"
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="description" className="admin-label">
                Summary
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What makes this package worth booking?"
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>

        <AdminWidget title="Trip & pricing">
          <div className="admin-form-grid-2">
            <div>
              <label htmlFor="location" className="admin-label">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Dubai, UAE"
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
                placeholder="4 nights / 5 days"
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
                placeholder="International"
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
                placeholder="June – August 2026"
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-form-price-row">
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
                placeholder="1500"
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
            <div className="sm:col-span-2">
              <label htmlFor="priceNote" className="admin-label">
                Price note
              </label>
              <input
                id="priceNote"
                name="priceNote"
                value={priceNote}
                onChange={(event) => setPriceNote(event.target.value)}
                placeholder="per person (double sharing)"
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>

        <AdminWidget title="Cover photo">
          <ImageUpload
            label="Featured image"
            value={featuredImage}
            folder={uploadFolder}
            onChange={handleFeaturedChange}
          />

          {!showGallery ? (
            <button
              type="button"
              className="admin-text-button mt-3"
              onClick={() => setShowGallery(true)}
            >
              + Add gallery photos (optional)
            </button>
          ) : (
            <div className="mt-4 border-t border-[#f0f0f1] pt-4">
              <p className="admin-field-hint mb-3">
                Optional extra photos for the tour page gallery.
              </p>
              <MediaLibrary
                folder={uploadFolder}
                images={libraryImages}
                onImagesChange={setLibraryImages}
                featuredImage={featuredImage}
                onFeaturedChange={setFeaturedImage}
                gallery={gallery}
                onGalleryChange={setGallery}
              />
            </div>
          )}
        </AdminWidget>

        {!showExtras ? (
          <button
            type="button"
            className="admin-tour-extras-toggle"
            onClick={() => setShowExtras(true)}
          >
            + Add highlights, inclusions & overview (optional)
          </button>
        ) : (
          <AdminWidget title="Page details">
            <div className="space-y-4">
              <div>
                <label htmlFor="highlights" className="admin-label">
                  Highlights
                </label>
                <textarea
                  id="highlights"
                  rows={3}
                  value={highlightsText}
                  onChange={(event) => setHighlightsText(event.target.value)}
                  placeholder={"Desert safari\nCity tour\nDaily breakfast"}
                  className="admin-input"
                />
                <p className="admin-field-hint">One item per line</p>
              </div>

              <div>
                <label htmlFor="included" className="admin-label">
                  What&apos;s included
                </label>
                <textarea
                  id="included"
                  rows={3}
                  value={includedText}
                  onChange={(event) => setIncludedText(event.target.value)}
                  placeholder={"Flights\nHotel\nAirport transfers"}
                  className="admin-input"
                />
                <p className="admin-field-hint">One item per line</p>
              </div>

              <div>
                <label htmlFor="overview" className="admin-label">
                  Overview
                </label>
                <textarea
                  id="overview"
                  rows={3}
                  value={overviewText}
                  onChange={(event) => setOverviewText(event.target.value)}
                  placeholder="Longer paragraphs for the tour page (one per line)"
                  className="admin-input"
                />
              </div>
            </div>
          </AdminWidget>
        )}
      </div>

      <div className="admin-editor-sidebar">
        <div className="admin-tour-sidebar-sticky space-y-4">
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
                  <option value="draft">Draft — hidden from site</option>
                  <option value="published">Published — live on site</option>
                </select>
              </div>

              {isNew ? (
                <p className="admin-field-hint m-0">
                  Save as draft first if you want to review before going live.
                </p>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-[#f0f0f1] pt-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="admin-login-submit"
                >
                  {pending
                    ? "Saving…"
                    : status === "published"
                      ? tour
                        ? "Update tour"
                        : "Publish tour"
                      : isNew
                        ? "Save draft"
                        : "Save changes"}
                </button>
                {tour && status === "published" && slug ? (
                  <Link
                    href={`/tours/${slug}`}
                    target="_blank"
                    className="admin-button-secondary justify-center"
                  >
                    Preview live page
                  </Link>
                ) : null}
                <Link href="/admin/tours" className="admin-button-secondary justify-center">
                  Cancel
                </Link>
              </div>
            </div>
          </AdminWidget>
        </div>
      </div>
    </form>
  );
}
