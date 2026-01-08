"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    planName: string;
    classes: number;
  } | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Verify the session and get details
      verifyPurchase();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPurchase = async () => {
    try {
      const response = await fetch(`/api/client/checkout/verify?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setPurchaseDetails(data);
      }
    } catch (error) {
      console.error("Error verifying purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Compra Confirmada!
          </h1>

          <p className="text-gray-600 mb-6">
            {purchaseDetails ? (
              <>
                Seu plano <strong>{purchaseDetails.planName}</strong> com{" "}
                <strong>{purchaseDetails.classes} aulas</strong> foi ativado com sucesso.
              </>
            ) : (
              "Seu plano foi ativado com sucesso!"
            )}
          </p>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-3">Agora você pode:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Agendar suas aulas online
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ver seus créditos no dashboard
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Receber lembretes por email e WhatsApp
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard/classes/book"
              className="block w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Agendar Minha Primeira Aula
            </Link>
            <Link
              href="/dashboard"
              className="block w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ir para o Dashboard
            </Link>
          </div>

          {/* Receipt Notice */}
          <p className="text-xs text-gray-500 mt-6">
            Um recibo foi enviado para seu email.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
