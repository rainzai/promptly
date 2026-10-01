const base =
  'inline-flex items-center gap-1 rounded-full bg-crimson font-bold text-white transition duration-150 hover:-translate-y-px hover:bg-crimson-dark'

const sizes = {
  sm: 'px-[18px] py-[9px] text-[0.9rem]',
  lg: 'px-[30px] py-[15px] text-[1.02rem] shadow-[0_16px_30px_-14px_rgba(139,26,43,0.75)]',
}

export default function Button({ size = 'sm', className = '', children, ...props }) {
  return (
    <button type="button" className={`${base} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
