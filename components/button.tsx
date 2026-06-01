import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "neutral" | "danger";
};

const tones = {
  primary: "bg-brand text-white hover:bg-blue-700",
  neutral: "border border-line bg-white text-ink hover:bg-cloud",
  danger: "bg-danger text-white hover:bg-orange-700"
};

export function Button({ children, tone = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
