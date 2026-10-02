interface MarqueeProps {
  items: string[];
  separator?: string;
  className?: string;
  speedSeconds?: number;
}

export function Marquee({
  items,
  separator = "✦",
  className = "",
  speedSeconds = 30,
}: MarqueeProps) {
  const row = (
    <>
      {items.map((item, i) => (
        <span key={i} className="flex items-center shrink-0">
          <span className="px-6 text-sm sm:text-base font-semibold uppercase tracking-[0.25em] whitespace-nowrap">
            {item}
          </span>
          <span aria-hidden="true" style={{ color: "#D4A017" }}>
            {separator}
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div
      className={`relative w-full overflow-hidden py-5 select-none ${className}`}
      style={{
        borderTop: "1px solid rgba(212,160,23,0.15)",
        borderBottom: "1px solid rgba(212,160,23,0.15)",
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
      aria-hidden="true"
    >
      <div
        className="marquee-track text-white/55"
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {row}
        {row}
      </div>
    </div>
  );
}
