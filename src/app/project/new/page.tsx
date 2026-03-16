"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepIndicator from "@/components/StepIndicator";

export default function NewProjectPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [productName, setProductName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, productName, url: url || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "プロジェクトの作成に失敗しました");
      }

      const data = await res.json();
      router.push(`/project/${data.id}/research`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">新規プロジェクト</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            戻る
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator currentStep={1} />

        <div className="max-w-lg mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              プロジェクト情報
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  企業名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="株式会社サンプル"
                />
              </div>

              <div>
                <label
                  htmlFor="productName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="サンプル商品"
                />
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL（任意）
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="https://example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    作成中...
                  </span>
                ) : (
                  "プロジェクトを作成"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
