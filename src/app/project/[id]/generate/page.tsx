"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StepIndicator from "@/components/StepIndicator";
import ImageGrid from "@/components/ImageGrid";
import FileUploader from "@/components/FileUploader";

type ImageItem = {
  id: string;
  url: string;
  localPath?: string;
};

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [collectedImages, setCollectedImages] = useState<ImageItem[]>([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [productImageIds, setProductImageIds] = useState<string[]>([]);
  const [trainingImageIds, setTrainingImageIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/images`);
        if (!res.ok) throw new Error("画像の取得に失敗しました");
        const data = await res.json();
        setCollectedImages(data.images || []);
      } catch {
        // handle silently
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, [projectId]);

  const handleToggleReference = useCallback((id: string) => {
    setSelectedReferenceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleProductUpload = async (files: File[]) => {
    setError("");
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("projectId", projectId);
    formData.append("type", "product");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("アップロードに失敗しました");
      const data = await res.json();
      setProductImageIds((prev) => [...prev, ...(data.ids || [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleTrainingUpload = async (files: File[]) => {
    setError("");
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("projectId", projectId);
    formData.append("type", "training");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("アップロードに失敗しました");
      const data = await res.json();
      setTrainingImageIds((prev) => [...prev, ...(data.ids || [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 2000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          productImageIds,
          referenceImageIds: selectedReferenceIds,
          trainingImageIds,
        }),
      });

      if (!res.ok) throw new Error("画像生成に失敗しました");

      setProgress(100);
      clearInterval(interval);

      setTimeout(() => {
        router.push(`/project/${projectId}/select`);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">画像生成</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ダッシュボードへ
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <StepIndicator currentStep={3} />

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200">
            {error}
          </div>
        )}

        {/* Product Image Upload */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">商品画像</h2>
          <p className="text-sm text-gray-500 mb-4">
            商品の画像をアップロードしてください
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <FileUploader
              onUpload={handleProductUpload}
              accept="image/*"
              multiple
              label="商品画像をドラッグ＆ドロップ、またはクリックして選択"
            />
            {productImageIds.length > 0 && (
              <p className="mt-3 text-sm text-green-600">
                {productImageIds.length}枚の画像がアップロードされました
              </p>
            )}
          </div>
        </section>

        {/* Reference Image Selection */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">参考画像</h2>
          <p className="text-sm text-gray-500 mb-4">
            収集した画像から参考にする画像を選択してください（{selectedReferenceIds.length}枚選択中）
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {loadingImages ? (
              <div className="text-center py-8">
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
                <p className="text-gray-500">画像を読み込み中...</p>
              </div>
            ) : collectedImages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                収集された画像がありません
              </p>
            ) : (
              <ImageGrid
                images={collectedImages}
                selectable
                selectedIds={selectedReferenceIds}
                onToggle={handleToggleReference}
              />
            )}
          </div>
        </section>

        {/* Training Image Upload */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">学習用画像</h2>
          <p className="text-sm text-gray-500 mb-4">
            品質向上のための参考画像をアップロードしてください（任意）
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <FileUploader
              onUpload={handleTrainingUpload}
              accept="image/*"
              multiple
              label="学習用画像をドラッグ＆ドロップ、またはクリックして選択"
            />
            {trainingImageIds.length > 0 && (
              <p className="mt-3 text-sm text-green-600">
                {trainingImageIds.length}枚の画像がアップロードされました
              </p>
            )}
          </div>
        </section>

        {/* Generate Button */}
        <div className="mt-10 flex justify-end">
          {generating ? (
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  画像を生成中...
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={productImageIds.length === 0}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              画像を生成
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
