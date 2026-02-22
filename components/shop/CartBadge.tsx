"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/shop/CartContext";

export function CartBadge() {
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <Link
      href="/shop/cart"
      className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
    >
      <ShoppingCart className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
        {itemCount > 9 ? "9+" : itemCount}
      </span>
    </Link>
  );
}
