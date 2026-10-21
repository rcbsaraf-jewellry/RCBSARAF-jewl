export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-20 overflow-auto overflow-x-hidden bg-[#f4f1ea] pb-[env(safe-area-inset-bottom)]">
      {children}
    </div>
  );
}
