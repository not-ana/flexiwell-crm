"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "success" | "error">("loading");
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setStatus("invalid");
      setErrorMessage("Token de convite inválido ou ausente.");
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify-invite?token=${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setUserInfo(data.user);
        setStatus("valid");
      } else {
        setStatus("invalid");
        setErrorMessage(data.error || "Convite inválido ou expirado.");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      setStatus("invalid");
      setErrorMessage("Erro ao verificar convite.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setErrorMessage(data.error || "Erro ao ativar conta.");
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      setErrorMessage("Erro ao ativar conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conta Ativada!</h1>
          <p className="text-gray-600 mb-6">
            Sua conta foi ativada com sucesso. Você será redirecionado para o login...
          </p>
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo(a) à Equipe!</h1>
            <p className="text-gray-600">Crie sua senha para ativar sua conta</p>
          </div>

          {/* User Info */}
          {userInfo && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-700">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userInfo.name}</p>
                  <p className="text-sm text-gray-500">{userInfo.email}</p>
                  <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mt-1">
                    {userInfo.role === "admin" ? "Administrador" :
                     userInfo.role === "teacher" ? "Professor" : "Recepcionista"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {errorMessage && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Ativando...
                </>
              ) : (
                "Ativar Minha Conta"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
