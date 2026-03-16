"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StepIndicator from "@/components/StepIndicator";
import FileUploader from "@/components/FileUploader";

type SelectedImage = {
  id: string;
  url: string;
  category: string;
};

type ChallengeSummary = {
  id: string;
  title: string;
};

export default function ExportPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [templateUploaded, setTemplateUploaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/summary`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        setSelectedImages(data.selectedImages || []);
        setChallenges(data.challenges || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleTemplateUpload = async (files: File[]) => {
    setError("");
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("projectId", projectId);
    formData.append("type", "template");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("テンプレートのアップロードに失敗しました");
      setTemplateUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const handleExport = async () => {
    setError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) throw new Error("資料の生成に失敗しました");

      const data = await res.json();
      setDownloadUrl(data.downloadUrl || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  const withProductCount = selectedImages.filter(
    (img) => img.category === "withProduct"
  ).length;
  const withoutProductCount = selectedImages.filter(
    (img) => img.category === "withoutProduct"
  ).length;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">資料作成</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ダッシュボードへ
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <StepIndicator currentStep={5} />

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200">
            {error}
          </div>
        )}

        {/* Template Upload */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            学習用テンプレート
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            PPTXテンプレートをアップロードしてください
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <FileUploader
              onUpload={handleTemplateUpload}
              accept=".pptx,.ppt"
              label="PPTXテンプレートをドラッグ＆ドロップ、またはクリックして選択"
            />
            {templateUploaded && (
              <p className="mt-3 text-sm text-green-600">
                テンプレートがアップロードされました
              </p>
            )}
          </div>
        </section>

        {/* Preview */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">プレビュー</h2>

          {loading ? (
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
              <p className="text-gray-500">データを読み込み中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selected Images Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">選択画像</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>商品使用イメージ: {withProductCount}枚</p>
                  <p>商品不使用イメージ: {withoutProductCount}枚</p>
                  <p className="font-medium text-gray-900 pt-2 border-t border-gray-100">
                    合計: {selectedImages.length}枚
                  </p>
                </div>
                {selectedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {selectedImages.slice(0, 8).map((img) => (
                      <div
                        key={img.id}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {selectedImages.length > 8 && (
                      <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                        +{selectedImages.length - 8}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Challenges Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">課題一覧</h3>
                {challenges.length === 0 ? (
                  <p className="text-sm text-gray-500">課題データがありません</p>
                ) : (
                  <ul className="space-y-2">
                    {challenges.map((challenge) => (
                      <li
                        key={challenge.id}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-0.5 shrink-0">
                          &bull;
                        </span>
                        {challenge.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Export / Download */}
        <div className="mt-10 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            完了
          </Link>

          <div className="flex items-center gap-4">
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                ダウンロード
              </a>
            ) : (
              <button
                onClick={handleExport}
                disabled={generating}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
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
                    生成中...
                  </span>
                ) : (
                  "資料を生成"
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
