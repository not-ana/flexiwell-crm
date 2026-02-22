"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, X, Menu } from "lucide-react";
import { useCart } from "@/lib/shop/CartContext";

export function ShopHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itemCount, openDrawer } = useCart();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/plans", label: "Class Plans" },
  ];

  const updateSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      router.replace(`/shop?q=${encodeURIComponent(value)}`, { scroll: false });
    } else {
      router.replace("/shop", { scroll: false });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(searchQuery);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/shop" className="flex-shrink-0">
            <Image
              src="/flexiwell-logo.svg"
              alt="FlexiWell"
              width={100}
              height={22}
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5 flex-shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Inline search — compact, always visible on desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center flex-1 max-w-xs ml-auto relative"
          >
            <Search className="absolute left-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-100 border border-transparent rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateSearch("")}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Right actions: Cart + Mobile menu */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto sm:ml-0">
            {/* Mobile search icon — only on small screens */}
            <Link
              href="/shop"
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <button
              type="button"
              onClick={openDrawer}
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} className="relative sm:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
