import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-current [&_svg]:transition-colors shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active-scale cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-white border border-zinc-900 hover:!bg-white hover:!text-zinc-900 hover:!border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 dark:hover:!bg-zinc-900 dark:hover:!text-white dark:hover:!border-zinc-100 shadow-xs transition-all',
        destructive:
          'bg-destructive text-white hover:!bg-destructive/90 shadow-xs focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/80 transition-colors',
        outline:
          'border border-border/70 bg-background shadow-xs hover:!bg-zinc-900 hover:!text-white hover:!border-zinc-900 dark:border-zinc-800 dark:hover:!bg-zinc-100 dark:hover:!text-zinc-900 dark:hover:!border-zinc-100 transition-all',
        secondary:
          'bg-zinc-100 text-zinc-900 hover:!bg-zinc-900 hover:!text-white dark:bg-zinc-800 dark:text-zinc-100 dark:hover:!bg-zinc-100 dark:hover:!text-zinc-900 shadow-xs transition-all',
        ghost:
          'hover:!bg-zinc-900 hover:!text-white dark:hover:!bg-zinc-100 dark:hover:!text-zinc-900 transition-all',
        link:
          'text-primary underline-offset-4 hover:underline',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4 text-base',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant || 'default'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
