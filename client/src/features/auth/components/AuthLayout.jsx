import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-sf-deep flex items-center justify-center p-sf-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-sf-3 mb-sf-8">
          <div className="w-10 h-10 rounded-sf-md bg-primary-500 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Link to="/" className="text-sf-2xl font-bold text-slate-50 tracking-tight hover:text-primary-400 transition-colors">
            SketchFlow
          </Link>
        </div>

        {/* Card */}
        <div className="bg-sf-raised border border-slate-700 rounded-sf-lg shadow-sf-floating p-sf-8">
          {/* Title */}
          {title && (
            <div className="mb-sf-6">
              <h1 className="text-sf-xl font-semibold text-slate-50 mb-sf-1">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sf-base text-slate-400">{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
