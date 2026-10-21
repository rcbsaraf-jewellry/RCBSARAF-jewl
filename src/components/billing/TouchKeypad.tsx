"use client";

export function TouchKeypad({
  value,
  onChange,
  onDone,
}: {
  value: string;
  onChange: (next: string) => void;
  onDone?: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  function press(key: string) {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "." && value.includes(".")) return;
    onChange(`${value}${key}`);
  }

  return (
    <div className="mt-3 grid grid-cols-3 gap-2 md:hidden">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          className="flex min-h-12 touch-manipulation items-center justify-center rounded-xl border border-[#e7e1d8] bg-white text-lg font-semibold"
        >
          {key}
        </button>
      ))}
      {onDone && (
        <button type="button" onClick={onDone} className="col-span-3 flex min-h-12 touch-manipulation items-center justify-center rounded-xl bg-[#c9a227] text-sm font-semibold text-[#1c1917]">
          Done
        </button>
      )}
    </div>
  );
}
