import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-[#e7e1d8] bg-[#f4f1ea] px-3 text-sm text-[#1c1917] outline-none placeholder:text-stone-400 focus:border-[#c9a227] focus:bg-white focus:ring-2 focus:ring-[#c9a227]/20",
        className,
      )}
      {...props}
    />
  );
}
