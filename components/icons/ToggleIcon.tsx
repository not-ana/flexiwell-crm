export default function ToggleIcon({ className = "w-10 h-6", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="40"
        height="24"
        rx="12"
        fill={active ? "currentColor" : "#D1D5DB"}
      />
      <circle
        cx={active ? "28" : "12"}
        cy="12"
        r="9"
        fill="white"
      />
    </svg>
  );
}
