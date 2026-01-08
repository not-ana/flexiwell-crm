"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui";

interface ClientPlan {
  type: string;
  totalClasses: number;
  remainingClasses: number;
  usedClasses: number;
  startDate: string;
  endDate: string;
  price: number;
}

interface PlanPackage {
  id: string;
  name: string;
  description: string;
  classes: number;
  duration: string;
  price: number;
  pricePerClass: number;
  popular?: boolean;
  savings?: number;
}

// Available plan packages - In a real app, this would come from the database/API
const planPackages: PlanPackage[] = [
  {
    id: "drop-in",
    name: "Aula Avulsa",
    description: "Para quem quer experimentar",
    classes: 1,
    duration: "30 dias",
    price: 60,
    pricePerClass: 60,
  },
  {
    id: "pack-4",
    name: "Pacote 4 Aulas",
    description: "Ideal para iniciantes",
    classes: 4,
    duration: "30 dias",
    price: 200,
    pricePerClass: 50,
    savings: 40,
  },
  {
    id: "monthly",
    name: "Mensal",
    description: "Para prática regular",
    classes: 8,
    duration: "30 dias",
    price: 350,
    pricePerClass: 43.75,
    popular: true,
    savings: 130,
  },
  {
    id: "quarterly",
    name: "Trimestral",
    description: "Compromisso de 3 meses",
    classes: 24,
    duration: "90 dias",
    price: 900,
    pricePerClass: 37.50,
    savings: 540,
  },
  {
    id: "annual",
    name: "Anual",
    description: "Melhor custo-benefício",
    classes: 96,
    duration: "365 dias",
    price: 2880,
    pricePerClass: 30,
    savings: 2880,
  },
];

export default function PlansPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<ClientPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchCurrentPlan();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch(`/api/clients/${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.client?.plan || null);
      }
    } catch (error) {
      console.error("Error fetching current plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: PlanPackage) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;

    setIsProcessing(true);

    try {
      // Create Stripe checkout session for client plan purchase
      const response = await fetch("/api/client/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          classes: selectedPlan.classes,
          price: selectedPlan.price,
          duration: selectedPlan.duration,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        // Handle success without Stripe (for testing/demo)
        alert("Plano adquirido com sucesso!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const daysRemaining = currentPlan?.endDate
    ? Math.max(0, Math.ceil((new Date(currentPlan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planos e Pacotes</h1>
          <p className="text-gray-600">Escolha o plano ideal para sua prática</p>
        </div>

        {/* Current Plan Card */}
        {currentPlan && currentPlan.type !== "none" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Seu plano atual</p>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {currentPlan.type === "monthly" ? "Mensal" :
                   currentPlan.type === "quarterly" ? "Trimestral" :
                   currentPlan.type === "annual" ? "Anual" :
                   currentPlan.type === "drop-in" ? "Avulso" : currentPlan.type}
                </h2>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">{currentPlan.remainingClasses}</p>
                  <p className="text-sm text-gray-500">aulas restantes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{currentPlan.usedClasses}</p>
                  <p className="text-sm text-gray-500">aulas usadas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">{daysRemaining}</p>
                  <p className="text-sm text-gray-500">dias restantes</p>
                </div>
              </div>

              {daysRemaining <= 7 && (
                <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Seu plano expira em breve!
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progresso do plano</span>
                <span>{Math.round((currentPlan.usedClasses / currentPlan.totalClasses) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentPlan.usedClasses / currentPlan.totalClasses) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {planPackages.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                plan.popular
                  ? "border-primary-500 shadow-lg"
                  : "border-gray-200 hover:border-primary-300"
              }`}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    R${plan.price.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-gray-500 text-sm">/{plan.duration}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{plan.classes} {plan.classes === 1 ? "aula" : "aulas"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">R${plan.pricePerClass.toFixed(2)}/aula</span>
                  </div>
                  {plan.savings && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 font-medium">Economia de R${plan.savings}</span>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Escolher Plano
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Todos os planos incluem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Agendamento Online</h3>
              <p className="text-sm text-gray-500">Agende suas aulas 24/7 pelo app ou site</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Suporte WhatsApp</h3>
              <p className="text-sm text-gray-500">Tire dúvidas direto pelo WhatsApp</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Reposição de Aulas</h3>
              <p className="text-sm text-gray-500">Cancele com 12h de antecedência e reponha</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Instrutores Certificados</h3>
              <p className="text-sm text-gray-500">Profissionais qualificados e experientes</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Perguntas Frequentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Posso cancelar meu plano?</h3>
              <p className="text-sm text-gray-600">
                Sim, você pode cancelar a qualquer momento. As aulas restantes permanecem válidas até o vencimento do plano.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Como funciona a reposição?</h3>
              <p className="text-sm text-gray-600">
                Cancele com pelo menos 12 horas de antecedência e o crédito será devolvido automaticamente.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Posso congelar meu plano?</h3>
              <p className="text-sm text-gray-600">
                Planos trimestrais e anuais permitem congelamento de até 30 dias. Entre em contato com o suporte.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Posso transferir aulas para outra pessoa?</h3>
              <p className="text-sm text-gray-600">
                Aulas não são transferíveis, mas você pode trazer um amigo na sua aula (sujeito a disponibilidade).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirmar Compra</h2>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedPlan.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aulas</span>
                    <span className="text-gray-900">{selectedPlan.classes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Validade</span>
                    <span className="text-gray-900">{selectedPlan.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Preço por aula</span>
                    <span className="text-gray-900">R${selectedPlan.pricePerClass.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-primary-600">R${selectedPlan.price.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Ao confirmar, você será redirecionado para a página de pagamento seguro.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                  </>
                ) : (
                  "Pagar Agora"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
