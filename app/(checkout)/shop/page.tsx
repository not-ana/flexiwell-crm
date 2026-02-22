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
      <div className="bg-primary-50">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 flex items-center gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              Mix, Match &amp; Save<br />Up to 30% Off
            </h1>
            <p className="text-gray-500 text-sm sm:text-base mb-5">
              Pick the essentials you want — nothing more, nothing less.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("sale")}
              className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary-700 transition-colors"
            >
              Shop now
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <div className="relative w-36 h-36 lg:w-44 lg:h-44 rounded-2xl overflow-hidden">
              <Image
                src={products[0].image}
                alt={products[0].name}
                fill
                sizes="176px"
                className="object-cover"
                priority
              />
            </div>
            <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden">
              <Image
                src={products[10].image}
                alt={products[10].name}
                fill
                sizes="192px"
                className="object-cover"
                priority
              />
            </div>
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden hidden lg:block">
              <Image
                src={products[1].image}
                alt={products[1].name}
                fill
                sizes="160px"
                className="object-cover"
                priority
              />
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
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
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
