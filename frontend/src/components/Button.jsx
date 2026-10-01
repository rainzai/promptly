const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none'

const sizes = {
  sm: 'px-5 py-2.5 text-[0.92rem]',
  lg: 'px-7 py-4 text-[1.02rem]',
}

const variants = {
  primary: 'bg-crimson text-white hover:bg-crimson-dark',
  secondary: 'bg-white text-ink shadow-sm ring-1 ring-line hover:bg-cream',
}

// The crimson glow under primary buttons grows with their size.
const glows = {
  sm: 'shadow-[0_10px_22px_-12px_rgba(139,26,43,0.8)]',
  lg: 'shadow-[0_18px_34px_-14px_rgba(139,26,43,0.85)]',
}

export default function Button({
  size = 'sm',
  variant = 'primary',
  href,
  className = '',
  children,
  ...props
}) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${variant === 'primary' ? glows[size] : ''} ${className}`
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
