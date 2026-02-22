"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/shop/types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  formatCurrency,
}: CartItemRowProps) {
  const lineTotal = item.product.price * item.quantity;

  return (
    <div className="flex items-start gap-3 sm:gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Product image */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-50 relative overflow-hidden flex-shrink-0">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          sizes="80px"
          className="object-cover rounded-lg"
        />
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
              {item.product.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{item.product.sku}</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
            {formatCurrency(lineTotal)}
          </p>
        </div>

        {/* Quantity controls + remove */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity - 1)
              }
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 sm:w-10 text-center text-sm font-medium text-gray-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity + 1)
              }
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.product.id)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
