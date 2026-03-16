"use client";

type ImageItem = {
  id: string;
  url: string;
  localPath?: string;
};

type ImageGridProps = {
  images: ImageItem[];
  selectable?: boolean;
  selectedIds?: string[];
  onToggle?: (id: string) => void;
};

export default function ImageGrid({
  images,
  selectable = false,
  selectedIds = [],
  onToggle,
}: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((image) => {
        const isSelected = selectedIds.includes(image.id);
        return (
          <div
            key={image.id}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => selectable && onToggle?.(image.id)}
          >
            <div className="aspect-square bg-gray-100">
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {selectable && (
              <div className="absolute top-2 right-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white/80 border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
