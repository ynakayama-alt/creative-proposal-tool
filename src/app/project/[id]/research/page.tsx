"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StepIndicator from "@/components/StepIndicator";
import ImageGrid from "@/components/ImageGrid";

type ImageItem = {
  id: string;
  url: string;
  localPath?: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
};

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [images, setImages] = useState<ImageItem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingResearch, setLoadingResearch] = useState(true);
  const [errorImages, setErrorImages] = useState("");
  const [errorResearch, setErrorResearch] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        if (!res.ok) throw new Error("画像の収集に失敗しました");
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        setErrorImages(
          err instanceof Error ? err.message : "エラーが発生しました"
        );
      } finally {
        setLoadingImages(false);
      }
    };

    const fetchResearch = async () => {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
        if (!res.ok) throw new Error("調査に失敗しました");
        const data = await res.json();
        setChallenges(data.challenges || []);
      } catch (err) {
        setErrorResearch(
          err instanceof Error ? err.message : "エラーが発生しました"
        );
      } finally {
        setLoadingResearch(false);
      }
    };

    fetchImages();
    fetchResearch();
  }, [projectId]);

  const isLoading = loadingImages || loadingResearch;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">調査・収集</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ダッシュボードへ
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <StepIndicator currentStep={2} />

        {/* Images Section */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            収集画像一覧
          </h2>
          {loadingImages ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
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
              <p className="text-gray-500">画像を収集中...</p>
            </div>
          ) : errorImages ? (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-4 border border-red-200">
              {errorImages}
            </div>
          ) : images.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">画像が見つかりませんでした</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <ImageGrid images={images} />
            </div>
          )}
        </section>

        {/* Challenges Section */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">課題一覧</h2>
          {loadingResearch ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
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
              <p className="text-gray-500">調査中...</p>
            </div>
          ) : errorResearch ? (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-4 border border-red-200">
              {errorResearch}
            </div>
          ) : challenges.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">課題が見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <h3 className="font-bold text-gray-900 mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {challenge.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Next Step Button */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={() => router.push(`/project/${projectId}/generate`)}
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次のステップへ
          </button>
        </div>
      </main>
    </div>
  );
}
