interface LoadingSkeletonProps {
  lines?: number;
  height?: number;
  gap?: number;
}

export function LoadingSkeleton({ lines = 3, height = 16, gap = 10 }: LoadingSkeletonProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton"
          style={{ height, width: index === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
