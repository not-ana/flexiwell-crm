interface FileIconProps {
  className?: string;
  type?: "csv" | "pdf" | "doc" | "default";
}

export default function FileIcon({ className, type = "default" }: FileIconProps) {
  const colors = {
    csv: { bg: "#ECFDF3", text: "#027A48" },
    pdf: { bg: "#FEF3F2", text: "#B42318" },
    doc: { bg: "#EFF8FF", text: "#175CD3" },
    default: { bg: "#F9FAFB", text: "#344054" },
  };

  const color = colors[type];

  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-lg ${className || ""}`}
      style={{ backgroundColor: color.bg }}
    >
      <span className="text-xs font-bold uppercase" style={{ color: color.text }}>
        {type === "default" ? "FILE" : type}
      </span>
    </div>
  );
}
