export default function SwitchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.1667 2.5L17.5 5.83333L14.1667 9.16667"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 9.16667V7.5C2.5 6.61594 2.85119 5.76810 3.47631 5.14298C4.10143 4.51786 4.94928 4.16667 5.83333 4.16667H17.5"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83333 17.5L2.5 14.1667L5.83333 10.8333"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 10.8333V12.5C17.5 13.3841 17.1488 14.2319 16.5237 14.857C15.8986 15.4821 15.0507 15.8333 14.1667 15.8333H2.5"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
