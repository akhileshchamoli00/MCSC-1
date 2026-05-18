export function AskLogo({ className = "h-11 w-auto", size }: { className?: string, size?: number }) {
  return (
    <>
      <img 
        src="/logo.png" 
        alt="MCS Consulting Logo" 
        className={`${className} dark:hidden`}
        style={size ? { height: size } : undefined}
      />
      <img 
        src="/logo-dark.png" 
        alt="MCS Consulting Logo" 
        className={`${className} hidden dark:block`}
        style={size ? { height: size } : undefined}
      />
    </>
  )
}
