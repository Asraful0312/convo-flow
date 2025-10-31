export default function CandidLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 12C8 9.79086 9.79086 8 12 8H16C18.2091 8 20 9.79086 20 12V16C20 18.2091 18.2091 20 16 20H12C9.79086 20 8 18.2091 8 16V12Z"
        fill="url(#coral-gradient)"
      />
      <path
        d="M16 16C16 13.7909 17.7909 12 20 12H24C26.2091 12 28 13.7909 28 16V20C28 22.2091 26.2091 24 24 24H20C17.7909 24 16 22.2091 16 20V16Z"
        fill="url(#teal-gradient)"
      />
      <defs>
        <linearGradient id="coral-gradient" x1="8" y1="8" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F56A4D" />
          <stop offset="1" stopColor="#F56A4D" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="teal-gradient" x1="16" y1="12" x2="28" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2EB7A7" />
          <stop offset="1" stopColor="#2EB7A7" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  )
}