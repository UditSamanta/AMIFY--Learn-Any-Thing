export default function LoadingButton({ 
  onClick, loading, disabled, children, className = '', ...props 
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative transition-all duration-200 
        ${loading || disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} 
        ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}
