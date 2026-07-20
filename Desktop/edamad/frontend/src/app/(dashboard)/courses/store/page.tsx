"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  ChevronDown,
  Filter,
  Headphones,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { CartPanel } from "@/components/edamad/cart-panel";
import { StoreCourseCard } from "@/components/edamad/store-course-card";
import { fetchStoreCourses, type CourseSort } from "@/services/courses";
import { useCartStore } from "@/store/cart-store";
import type { Course } from "@/types";

const trustItems = [
  { icon: Shield, title: "Secure Payments", desc: "Safe and encrypted transactions" },
  { icon: RefreshCw, title: "Instant Access", desc: "Start learning immediately after purchase" },
  { icon: Bookmark, title: "Lifetime Access", desc: "Learn at your own pace anytime, anywhere" },
  { icon: Headphones, title: "24/7 Support", desc: "We're here to help you succeed" },
];

const sortOptions: { value: CourseSort; label: string }[] = [
  { value: "default", label: "Default order" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "title_asc", label: "Title: A to Z" },
  { value: "title_desc", label: "Title: Z to A" },
];

function toCartItem(course: Course) {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    price: parseFloat(course.price),
    icon: course.icon,
  };
}

export default function CourseStorePage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CourseSort>("default");
  const [sortOpen, setSortOpen] = useState(false);

  const { items, addItem, removeItem, hasItem } = useCartStore();

  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ["store-courses", search, sort],
    queryFn: () => fetchStoreCourses({ search, sort }),
  });

  const sortLabel = useMemo(
    () => sortOptions.find((o) => o.value === sort)?.label ?? "Filter / Sort",
    [sort],
  );

  function handleAddToCart(course: Course) {
    if (hasItem(course.id)) {
      toast.info("This course is already in your cart.");
      return;
    }
    addItem(toCartItem(course));
    toast.success(`${course.title} added to cart`);
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-[#002B7F]">Course Store</h1>
      <p className="mt-1 text-[13px] text-[#6B7280]">
        Purchase individual nursing courses in Ghana cedis.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full bg-white pl-10"
            placeholder="Search courses by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#E5EAF2] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            <Filter className="h-4 w-4" />
            {sort === "default" ? "Filter / Sort" : sortLabel}
            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 z-10 mt-1 w-52 rounded-[10px] border border-[#E5EAF2] bg-white py-1 shadow-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSort(option.value);
                    setSortOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-[#F7F9FC] ${
                    sort === option.value ? "font-semibold text-[#0057FF]" : "text-[#374151]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-[13px] text-[#6B7280]">Loading courses...</p>
      ) : isError ? (
        <p className="mt-8 text-center text-[13px] text-[#EF4444]">
          Could not load courses. Make sure the backend is running.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <StoreCourseCard
                key={course.id}
                title={course.title}
                description={course.description ?? ""}
                price={course.price}
                icon={course.icon}
                iconBg={course.icon_bg}
                inCart={hasItem(course.id)}
                onAddToCart={() => handleAddToCart(course)}
              />
            ))}
          </div>
          <CartPanel items={items} onRemove={removeItem} />
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-[12px] border border-[#E5EAF2] bg-white p-4">
            <Icon className="h-5 w-5 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] font-semibold text-[#002B7F]">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[#6B7280]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
