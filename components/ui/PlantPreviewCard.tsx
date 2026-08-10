interface PlantPreviewCardProps {
  imageUrl?: string;
  label?: string;
  placeholder?: React.ReactNode;
  variant?: "dark" | "light";
}

export function PlantPreviewCard({
  imageUrl,
  label = "촬영한 식물 사진",
  placeholder,
  variant = "light",
}: PlantPreviewCardProps) {
  const isDark = variant === "dark";

  return (
    <div className="overflow-hidden rounded-3xl">
      <div
        className={`relative flex aspect-square items-center justify-center ${
          isDark ? "bg-primary" : "bg-mint"
        }`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="선택한 식물 사진"
            className="h-full w-full object-cover"
          />
        ) : (
          placeholder
        )}
      </div>
      {label && (
        <div className="bg-primary px-4 py-3 text-center text-sm font-medium text-white">
          {label}
        </div>
      )}
    </div>
  );
}
