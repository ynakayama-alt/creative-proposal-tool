"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StepIndicator from "@/components/StepIndicator";
import ImageGrid from "@/components/ImageGrid";

type ImageItem = {
  id: string;
  url: string;
  localPath?: string;
  category?: string;
};

export default function SelectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [withProductImages, setWithProductImages] = useState<ImageItem[]>([]);
  const [withoutProductImages, setWithoutProductImages] = useState<ImageItem[]>([]);
  const [selectedWithIds, setSelectedWithIds] = useState<string[]>([]);
  const [selectedWithoutIds, setSelectedWithoutIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/generated`);
        if (!res.ok) throw new Error("画像の取得に失敗しました");
        const data = await res.json();
        setWithProductImages(data.withProduct || []);
        setWithoutProductImages(data.withoutProduct || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [projectId]);

  const handleToggleWith = useCallback((id: string) => {
    setSelectedWithIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleToggleWithout = useCallback((id: string) => {
    setSelectedWithoutIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedWithProductIds: selectedWithIds,
          selectedWithoutProductIds: selectedWithoutIds,
        }),
      });

      if (!res.ok) throw new Error("選択の保存に失敗しました");

      router.push(`/project/${projectId}/export`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelected = selectedWithIds.length + selectedWithoutIds.length;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">画像選択</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ダッシュボードへ
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <StepIndicator currentStep={4} />

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200">
            {error}
          </div>
        )}

        {/* Selection Count */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            選択中: <span className="font-bold text-blue-600">{totalSelected}</span> 枚
          </span>
          <span className="text-xs text-gray-400">
            商品使用: {selectedWithIds.length}枚 / 商品不使用: {selectedWithoutIds.length}枚
          </span>
        </div>

        {loading ? (
          <div className="mt-8 text-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3"
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
            <p className="text-gray-500">生成画像を読み込み中...</p>
          </div>
        ) : (
          <>
            {/* With Product Images */}
            <section className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                商品使用イメージ
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                商品を使用したシーンの画像を選択してください（{selectedWithIds.length}/10枚）
              </p>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {withProductImages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    画像がありません
                  </p>
                ) : (
                  <ImageGrid
                    images={withProductImages}
                    selectable
                    selectedIds={selectedWithIds}
                    onToggle={handleToggleWith}
                  />
                )}
              </div>
            </section>

            {/* Without Product Images */}
            <section className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                商品不使用イメージ
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                商品を使用していないシーンの画像を選択してください（{selectedWithoutIds.length}/10枚）
              </p>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {withoutProductImages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    画像がありません
                  </p>
                ) : (
                  <ImageGrid
                    images={withoutProductImages}
                    selectable
                    selectedIds={selectedWithoutIds}
                    onToggle={handleToggleWithout}
                  />
                )}
              </div>
            </section>
          </>
        )}

        {/* Submit Button */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || totalSelected === 0}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
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
                保存中...
              </span>
            ) : (
              "選択を確定"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
