export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d19] px-4 py-10">
      <div className="absolute left-[-10rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[100px]" />
      <div className="absolute bottom-[-14rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[110px]" />
      <div className="absolute left-8 top-8 flex items-center gap-3 text-white"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 font-black">C</div><div><p className="font-bold">CampusOS</p><p className="text-[10px] uppercase tracking-[.2em] text-slate-500">Student companion</p></div></div>
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
