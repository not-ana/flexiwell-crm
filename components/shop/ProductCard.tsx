"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Check, Star } from "lucide-react";
import type { Product } from "@/lib/shop/types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  formatCurrency: (amount: number) => string;
}

export function ProductCard({ product, onAddToCart, formatCurrency }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      {/* Image */}
      <div className="aspect-square bg-gray-50 relative">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
        />
        {product.badge && (
          <span
            className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
              product.badge === "Best Seller"
                ? "bg-primary-100 text-primary-700"
                : product.badge === "New"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
          {product.shortDescription}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          disabled={!product.inStock}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            added
              ? "bg-green-500 text-white"
              : product.inStock
              ? "bg-gray-100 text-gray-900 hover:bg-primary-600 hover:text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
