import { create } from "zustand";

type UIState = {
  salesOpen: boolean;
  purchasesOpen: boolean;
  timeOpen: boolean;
  accountantOpen: boolean;
  toggle: (key: "salesOpen" | "purchasesOpen" | "timeOpen" | "accountantOpen") => void;
  ensureOpen: (pathname: string) => void;
};

export const useUI = create<UIState>((set) => ({
  salesOpen: true,
  purchasesOpen: false,
  timeOpen: false,
  accountantOpen: false,
  toggle: (key) => set((s) => ({ [key]: !s[key] })),
  ensureOpen: (pathname) =>
    set({
      salesOpen: pathname.startsWith("/sales") ? true : undefined,
      purchasesOpen: pathname.startsWith("/purchases") ? true : undefined,
      timeOpen: pathname.startsWith("/time") ? true : undefined,
      accountantOpen: pathname.startsWith("/accountant") ? true : undefined,
    } as Partial<UIState>),
}));
