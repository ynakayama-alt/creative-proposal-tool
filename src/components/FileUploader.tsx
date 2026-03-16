"use client";

import { useCallback, useRef, useState } from "react";

type FileUploaderProps = {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
};

export default function FileUploader({
  onUpload,
  accept,
  multiple = false,
  label = "ファイルをドラッグ＆ドロップ、またはクリックして選択",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);
      setFileNames(fileArray.map((f) => f.name));
      onUpload(fileArray);
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg
          className="mx-auto w-12 h-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-gray-600">{label}</p>
        {accept && (
          <p className="text-xs text-gray-400 mt-1">対応形式: {accept}</p>
        )}
      </div>
      {fileNames.length > 0 && (
        <div className="mt-3 space-y-1">
          {fileNames.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 rounded px-3 py-1.5"
            >
              <svg
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
