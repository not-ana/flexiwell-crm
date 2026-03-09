"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/lib/shop/CartContext";
import { products } from "@/lib/shop/products";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shop/shippingMethods";
import { ProductCard } from "@/components/shop/ProductCard";
import { CartBadge } from "@/components/shop/CartBadge";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import Image from "next/image";
import {
  Truck,
  ArrowRight,
} from "lucide-react";

type FilterTab = "all" | "best-sellers" | "new" | "sale";

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "best-sellers", label: "Best Sellers" },
  { id: "new", label: "New Arrivals" },
  { id: "sale", label: "On Sale" },
];

const badgeMap: Record<Exclude<FilterTab, "all">, string> = {
  "best-sellers": "Best Seller",
  new: "New",
  sale: "Sale",
};

export default function ShopPage() {
  const { formatCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const filterParam = searchParams.get("filter") as FilterTab | null;
  const [activeTab, setActiveTab] = useState<FilterTab>(filterParam || "all");
  const searchQuery = searchParams.get("q") || "";

  // Sync tab with URL filter param
  useEffect(() => {
    if (filterParam && filterParam !== activeTab) {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  const filtered = useMemo(() => {
    let result = products;

    if (activeTab !== "all") {
      result = result.filter((p) => p.badge === badgeMap[activeTab]);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeTab, searchQuery]);

  return (
    <div>
      {/* Free shipping bar */}
      <div className="bg-pink-600">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm text-white/90">
          <Truck className="w-4 h-4 text-white flex-shrink-0" />
          <span>Free shipping on orders over <strong className="text-white font-bold">$75</strong></span>
        </div>
      </div>

      {/* Promo banner */}
      <div className="relative bg-[#f5f0eb] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 lg:py-24 flex items-center">
          <div className="relative z-10 flex-1 min-w-0 max-w-md">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-[1.1] tracking-tight">
              Mix, Match, and<br />Save Up to 30%
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-6">
              Pick the products you want — nothing more, nothing less.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("sale")}
              className="bg-gray-900 text-white font-medium text-sm px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Shop now
            </button>
          </div>
          <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-[55%] lg:w-[58%]">
            <div className="relative h-full">
              <Image
                src={products[0].image}
                alt={products[0].name}
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f5f0eb] via-[#f5f0eb]/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky filter tabs */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Results count */}
          <p className="text-xs text-gray-400 mb-4">
            {searchQuery
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQuery}"`
              : `Showing ${filtered.length} ${filtered.length === 1 ? "product" : "products"}`}
          </p>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addItem}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm mb-2">
                No products found.
              </p>
              <Link
                href="/shop"
                onClick={() => setActiveTab("all")}
                className="text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                View all products
              </Link>
            </div>
          )}

          {/* Plans cross-link */}
          <div className="mt-8 text-center">
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Looking for class packages? Browse Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-6 mb-4">
            <TrustBadges variant="horizontal" showPaymentBrands />
          </div>
        </div>
      </div>

      {/* Floating cart badge (mobile) */}
      <CartBadge />
    </div>
  );
}
