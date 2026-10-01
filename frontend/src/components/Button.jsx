const base =
  'inline-flex items-center justify-center gap-2 rounded-full bg-crimson font-semibold text-white transition duration-150 hover:-translate-y-px hover:bg-crimson-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson'

const sizes = {
  sm: 'px-5 py-2.5 text-[0.92rem] shadow-[0_10px_22px_-12px_rgba(139,26,43,0.8)]',
  lg: 'px-7 py-4 text-[1.02rem] shadow-[0_18px_34px_-14px_rgba(139,26,43,0.85)]',
}

export default function Button({ size = 'sm', href, className = '', children, ...props }) {
  const classes = `${base} ${sizes[size]} ${className}`
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
