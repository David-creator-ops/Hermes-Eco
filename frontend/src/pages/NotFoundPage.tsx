import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-[120px] font-bold text-white leading-none tracking-tighter">404</div>
        <p className="text-[14px] text-[#555] mt-3">Page not found</p>
        <Link to="/"
          className="inline-flex items-center gap-2 mt-6 h-9 px-5 rounded-md text-[13px] font-medium bg-white text-[#0a0a0a] hover:bg-[#e8e8e8] transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  );
}
