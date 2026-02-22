"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  Truck,
  Download,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import type { ShopOrderDetails } from "@/lib/shop/types";

export default function ShopSuccessPage() {
  const [order, setOrder] = useState<ShopOrderDetails | null>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("flexiwell-shop-order");
      if (stored) {
        setOrder(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Simple confetti animation
  useEffect(() => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#6938EF",
      "#F04438",
      "#12B76A",
      "#F79009",
      "#2E90FA",
      "#EE46BC",
    ];
    const particles: {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      vrot: number;
    }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * -1,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vy += 0.05;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No order found
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            It looks like you haven&apos;t placed an order yet.
          </p>
          <Link
            href="/shop"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      <div className="py-6 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Thank you for your order. A confirmation has been sent to{" "}
              <span className="font-medium text-gray-700">{order.email}</span>.
            </p>
          </div>

          {/* Order number + date */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm text-primary-700 font-medium">
                  Order Number
                </p>
                <p className="text-lg font-bold text-primary-900">
                  {order.orderNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-600" />
              <div className="text-right sm:text-left">
                <p className="text-sm text-primary-700 font-medium">
                  Order Date
                </p>
                <p className="text-sm text-primary-900">{order.date}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Items Ordered
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.sku} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gray-50 relative overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      SKU: {item.sku} &middot; Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping + Payment details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Shipping Address
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.address1}
                {order.shippingAddress.address2 && (
                  <>
                    <br />
                    {order.shippingAddress.address2}
                  </>
                )}
                <br />
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Payment
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {order.paymentMethod}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Truck className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {order.shippingMethod} &middot;{" "}
                  {order.estimatedDelivery}
                </p>
              </div>
            </div>
          </div>

          {/* Totals receipt */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-sm text-gray-700">
                  {formatCurrency(order.subtotal)}
                </p>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-600">Discount</p>
                  <p className="text-sm text-green-600">
                    -{formatCurrency(order.discount)}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Shipping ({order.shippingMethod})
                </p>
                <p
                  className={`text-sm ${
                    order.shipping === 0
                      ? "text-green-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {order.shipping === 0
                    ? "Free"
                    : formatCurrency(order.shipping)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Estimated Tax</p>
                <p className="text-sm text-gray-700">
                  {formatCurrency(order.estimatedTax)}
                </p>
              </div>
              <hr className="border-gray-200 my-2" />
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-gray-900">
                  Total
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<Truck className="w-4 h-4" />}
            >
              Track Order
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Receipt
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 mb-4">
            <TrustBadges variant="horizontal" />
          </div>
        </div>
      </div>
    </>
  );
}
