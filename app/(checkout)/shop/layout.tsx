"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/lib/shop/CartContext";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopFooter } from "@/components/shop/ShopFooter";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Show full shop header on browse pages, not during checkout flow
  const isShopBrowse = pathname === "/shop" || pathname === "/shop/cart";

  return (
    <CartProvider>
      <div className="bg-white min-h-screen flex flex-col">
        {isShopBrowse && (
          <Suspense>
            <ShopHeader />
          </Suspense>
        )}
        <div className="flex-1">
          <Suspense>{children}</Suspense>
        </div>
        <ShopFooter />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
