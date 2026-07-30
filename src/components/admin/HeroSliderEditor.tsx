"use client";

import { useActionState, useMemo, useState } from "react";
import {
  importDefaultHeroSlidesAction,
  saveHeroSlidesAction,
} from "@/app/admin/actions/hero-slides";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  DEFAULT_HERO_CTAS,
  type AdminHeroSlide,
  type HeroCta,
  type HeroCtaStyle,
} from "@/lib/hero-slides";

type DraftCta = {
  label: string;
  href: string;
  style: HeroCtaStyle;
};

type DraftSlide = {
  key: string;
  id?: string;
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctas: DraftCta[];
  isActive: boolean;
};

type Props = {
  slides: AdminHeroSlide[];
};

function emptyCtas(): DraftCta[] {
  return [
    { label: "", href: "", style: "primary" },
    { label: "", href: "", style: "secondary" },
    { label: "", href: "", style: "secondary" },
  ];
}

function ctasToDraft(ctas: HeroCta[]): DraftCta[] {
  const draft = emptyCtas();
  const source = ctas.length > 0 ? ctas : DEFAULT_HERO_CTAS;
  source.slice(0, 3).forEach((cta, index) => {
    draft[index] = { label: cta.label, href: cta.href, style: cta.style };
  });
  return draft;
}

function toDraftSlides(slides: AdminHeroSlide[]): DraftSlide[] {
  return slides.map((slide) => ({
    key: slide.id,
    id: slide.id,
    imageUrl: slide.imageUrl,
    imageAlt: slide.imageAlt,
    eyebrow: slide.eyebrow,
    headline: slide.headline,
    body: slide.body,
    ctas: ctasToDraft(slide.ctas),
    isActive: slide.isActive,
  }));
}

function newDraftSlide(): DraftSlide {
  return {
    key: `new-${crypto.randomUUID()}`,
    imageUrl: "",
    imageAlt: "",
    eyebrow: "#2 Boundary Road · East Legon · Accra",
    headline: "",
    body: "",
    ctas: ctasToDraft(DEFAULT_HERO_CTAS),
    isActive: true,
  };
}

function compactCtas(ctas: DraftCta[]): HeroCta[] {
  return ctas
    .map((cta) => ({
      label: cta.label.trim(),
      href: cta.href.trim(),
      style: cta.style,
    }))
    .filter((cta) => cta.label || cta.href);
}

export function HeroSliderEditor({ slides }: Props) {
  const [drafts, setDrafts] = useState<DraftSlide[]>(() =>
    slides.length > 0 ? toDraftSlides(slides) : [newDraftSlide()],
  );
  const [saveState, saveAction, savePending] = useActionState(saveHeroSlidesAction, undefined);
  const [importState, importAction, importPending] = useActionState(
    importDefaultHeroSlidesAction,
    undefined,
  );

  useAdminActionFeedback(saveState, savePending, {
    loadingMessage: "Saving hero slides…",
  });
  useAdminActionFeedback(importState, importPending, {
    loadingMessage: "Importing default slides…",
  });

  const payload = useMemo(
    () =>
      JSON.stringify(
        drafts.map((slide, index) => ({
          id: slide.id,
          imageUrl: slide.imageUrl,
          imageAlt: slide.imageAlt,
          eyebrow: slide.eyebrow,
          headline: slide.headline,
          body: slide.body,
          ctas: compactCtas(slide.ctas),
          sortOrder: index + 1,
          isActive: slide.isActive,
        })),
      ),
    [drafts],
  );

  function updateSlide(key: string, patch: Partial<DraftSlide>) {
    setDrafts((current) =>
      current.map((slide) => (slide.key === key ? { ...slide, ...patch } : slide)),
    );
  }

  function updateCta(key: string, ctaIndex: number, patch: Partial<DraftCta>) {
    setDrafts((current) =>
      current.map((slide) => {
        if (slide.key !== key) return slide;
        const ctas = slide.ctas.map((cta, index) =>
          index === ctaIndex ? { ...cta, ...patch } : cta,
        );
        return { ...slide, ctas };
      }),
    );
  }

  function moveSlide(key: string, direction: -1 | 1) {
    setDrafts((current) => {
      const index = current.findIndex((slide) => slide.key === key);
      if (index < 0) return current;
      const next = index + direction;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function removeSlide(key: string) {
    setDrafts((current) => {
      if (current.length <= 1) return current;
      return current.filter((slide) => slide.key !== key);
    });
  }

  return (
    <div className="space-y-4">
      {slides.length === 0 ? (
        <div className="admin-postbox">
          <div className="admin-postbox-header">
            <h2>Import current homepage content</h2>
          </div>
          <div className="admin-postbox-body space-y-3">
            <p className="admin-field-hint mt-0">
              No slides in the database yet. Import the current homepage hero, or edit the blank
              slide below and save.
            </p>
            <form action={importAction}>
              <button type="submit" className="admin-button-secondary" disabled={importPending}>
                {importPending ? "Importing…" : "Import current homepage slides"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="slides" value={payload} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="admin-field-hint m-0">
            Each slide has its own image, copy, and CTAs. Inactive slides stay hidden on the
            homepage.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-button-secondary"
              onClick={() => setDrafts((current) => [...current, newDraftSlide()])}
            >
              Add slide
            </button>
            <button type="submit" className="admin-button-primary" disabled={savePending}>
              {savePending ? "Saving…" : "Save all"}
            </button>
          </div>
        </div>

        {drafts.map((slide, index) => (
          <article key={slide.key} className="admin-postbox">
            <div className="admin-postbox-header flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0">Slide {index + 1}</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => moveSlide(slide.key, -1)}
                  disabled={index === 0}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => moveSlide(slide.key, 1)}
                  disabled={index === drafts.length - 1}
                >
                  Move down
                </button>
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => removeSlide(slide.key)}
                  disabled={drafts.length <= 1}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="admin-postbox-body space-y-4">
              <label className="admin-settings-toggle">
                <input
                  type="checkbox"
                  checked={slide.isActive}
                  onChange={(event) => updateSlide(slide.key, { isActive: event.target.checked })}
                />
                <span>
                  <strong className="block text-[#1d2327]">Active on homepage</strong>
                  <span className="text-[#646970]">
                    Turn off to hide this slide without deleting it.
                  </span>
                </span>
              </label>

              <ImageUpload
                label="Background image"
                folder="hero"
                value={slide.imageUrl}
                onChange={(imageUrl) => updateSlide(slide.key, { imageUrl })}
              />

              <div>
                <label htmlFor={`hero-alt-${slide.key}`} className="admin-label">
                  Image alt text
                </label>
                <input
                  id={`hero-alt-${slide.key}`}
                  value={slide.imageAlt}
                  onChange={(event) => updateSlide(slide.key, { imageAlt: event.target.value })}
                  className="admin-input"
                  placeholder="Describe the photo"
                />
              </div>

              <div>
                <label htmlFor={`hero-eyebrow-${slide.key}`} className="admin-label">
                  Eyebrow
                </label>
                <input
                  id={`hero-eyebrow-${slide.key}`}
                  value={slide.eyebrow}
                  onChange={(event) => updateSlide(slide.key, { eyebrow: event.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label htmlFor={`hero-headline-${slide.key}`} className="admin-label">
                  Headline <span className="text-[#d63638]">(required when active)</span>
                </label>
                <input
                  id={`hero-headline-${slide.key}`}
                  value={slide.headline}
                  onChange={(event) => updateSlide(slide.key, { headline: event.target.value })}
                  className="admin-input"
                  required={slide.isActive}
                />
              </div>

              <div>
                <label htmlFor={`hero-body-${slide.key}`} className="admin-label">
                  Body
                </label>
                <textarea
                  id={`hero-body-${slide.key}`}
                  rows={3}
                  value={slide.body}
                  onChange={(event) => updateSlide(slide.key, { body: event.target.value })}
                  className="admin-input"
                />
              </div>

              <fieldset>
                <legend className="admin-label">CTAs (up to 3)</legend>
                <div className="mt-2 space-y-3">
                  {slide.ctas.map((cta, ctaIndex) => (
                    <div
                      key={ctaIndex}
                      className="admin-form-grid-2 gap-3 rounded-lg border border-[#dcdcde] p-3"
                    >
                      <div>
                        <label
                          htmlFor={`cta-label-${slide.key}-${ctaIndex}`}
                          className="admin-label"
                        >
                          Label
                        </label>
                        <input
                          id={`cta-label-${slide.key}-${ctaIndex}`}
                          value={cta.label}
                          onChange={(event) =>
                            updateCta(slide.key, ctaIndex, { label: event.target.value })
                          }
                          className="admin-input"
                          placeholder="Book a trip"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`cta-href-${slide.key}-${ctaIndex}`}
                          className="admin-label"
                        >
                          Link
                        </label>
                        <input
                          id={`cta-href-${slide.key}-${ctaIndex}`}
                          value={cta.href}
                          onChange={(event) =>
                            updateCta(slide.key, ctaIndex, { href: event.target.value })
                          }
                          className="admin-input"
                          placeholder="/book"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`cta-style-${slide.key}-${ctaIndex}`}
                          className="admin-label"
                        >
                          Style
                        </label>
                        <select
                          id={`cta-style-${slide.key}-${ctaIndex}`}
                          value={cta.style}
                          onChange={(event) =>
                            updateCta(slide.key, ctaIndex, {
                              style: event.target.value as HeroCtaStyle,
                            })
                          }
                          className="admin-input"
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          </article>
        ))}

        <div className="flex justify-end">
          <button type="submit" className="admin-button-primary" disabled={savePending}>
            {savePending ? "Saving…" : "Save all"}
          </button>
        </div>
      </form>
    </div>
  );
}
