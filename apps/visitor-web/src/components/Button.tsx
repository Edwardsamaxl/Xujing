import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'gold-outline'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const SIZE_CLASS: Record<Size, string> = {
  md: 'h-12 text-[15px]',
  lg: 'h-14 text-[16px]',
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-cinnabar text-white hover:shadow-[0_4px_16px_rgba(163,38,38,0.18)]',
  secondary:
    'bg-transparent text-cinnabar border border-cinnabar hover:bg-cinnabar/5',
  'gold-outline':
    'bg-transparent text-gold border border-gold hover:bg-gold/5',
}

/**
 * 全站统一的圆角按钮：跨页面字号、padding、active scale、disabled 行为一致。
 * 仍保留 className 透传，特殊页面（如 safe-area-inset 适配）可继续覆写样式。
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      className={[
        'rounded-full font-medium tracking-[0.04em]',
        'transition-all duration-200 ease-out',
        'active:scale-[0.96]',
        'disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed',
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
})
