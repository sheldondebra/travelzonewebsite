"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { formatAirport, searchAirports, type Airport } from "@/lib/airports";

type AirportSearchInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  excludeValue?: string;
};

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white py-2.5 pr-10 pl-9 text-sm outline-none transition-colors placeholder:text-gray-400 ${
    hasError
      ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
      : "border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
  }`;
}

export function AirportSearchInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Search city or airport",
  error,
  excludeValue,
}: AirportSearchInputProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const results = useMemo(() => {
    const airports = searchAirports(query, 8);
    if (!excludeValue) return airports;
    return airports.filter((airport) => formatAirport(airport) !== excludeValue);
  }, [query, excludeValue]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectAirport(airport: Airport) {
    const formatted = formatAirport(airport);
    onChange(formatted);
    setQuery(formatted);
    setOpen(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    onChange(next);
    setOpen(true);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectAirport(results[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </label>

      <div className="relative">
        <HiMagnifyingGlass
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          value={query}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClass(Boolean(error))}
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-gray-100 hover:text-navy"
            aria-label="Clear"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.map((airport, index) => {
            const formatted = formatAirport(airport);
            const active = index === activeIndex;
            return (
              <li key={airport.iata} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectAirport(airport)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                    active ? "bg-cream text-navy" : "text-navy hover:bg-cream/70"
                  }`}
                >
                  <span>
                    <span className="font-medium">{airport.city}</span>
                    <span className="ml-1.5 text-text-muted">{airport.country}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-navy">
                    {airport.iata}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-brand-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
