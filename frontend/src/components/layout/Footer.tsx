export function Footer() {
  return (
    <div className="px-4 py-6 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#151515] border border-[#222] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#7c3aed]">H</span>
          </div>
          <span className="text-[12px] text-[#555]">Hermes Eco</span>
        </div>
        <span className="text-[11px] text-[#333]">MIT · Nous Research</span>
      </div>
    </div>
  );
}
