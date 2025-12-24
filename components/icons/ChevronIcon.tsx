export default function ChevronIcon({ className = "w-6 h-6", direction = "down" }: { className?: string; direction?: "up" | "down" | "left" | "right" }) {
  const rotations = {
    up: "rotate-180",
    down: "rotate-0",
    left: "rotate-90",
    right: "-rotate-90",
  };

  return (
    <svg className={`${className} ${rotations[direction]}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
