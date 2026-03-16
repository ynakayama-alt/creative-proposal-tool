"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  companyName: string;
  productName: string;
  status: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/");
            return;
          }
          throw new Error("プロジェクトの取得に失敗しました");
        }
        const data = await res.json();
        setProjects(data.projects || []);
        setUserName(data.userName || "ユーザー");
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      draft: { text: "下書き", color: "bg-gray-100 text-gray-700" },
      research: { text: "調査中", color: "bg-yellow-100 text-yellow-700" },
      generating: { text: "生成中", color: "bg-blue-100 text-blue-700" },
      selecting: { text: "選択中", color: "bg-purple-100 text-purple-700" },
      completed: { text: "完了", color: "bg-green-100 text-green-700" },
    };
    return map[status] || { text: status, color: "bg-gray-100 text-gray-700" };
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            企画書作成ツール
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">プロジェクト一覧</h2>
          <Link
            href="/project/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            新規プロジェクト
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
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
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <svg
              className="mx-auto w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-2">
              プロジェクトがまだありません
            </p>
            <p className="text-gray-400 text-sm">
              「新規プロジェクト」ボタンから作成を始めましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const status = statusLabel(project.status);
              return (
                <Link
                  key={project.id}
                  href={`/project/${project.id}/research`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">
                      {project.productName}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                    >
                      {status.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {project.companyName}
                  </p>
                  <p className="text-xs text-gray-400">
                    作成日:{" "}
                    {new Date(project.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
