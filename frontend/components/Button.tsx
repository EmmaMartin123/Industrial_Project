"use client"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
}

export default function Button({
  children,
  className,
  isLoading,
  loadingText,
  ...props
}: ButtonProps) {
  return (
    <button
      className={
        "btn btn-primary rounded-md px-4 py-2"
      }
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? loadingText || "Loading..." : children}
    </button>
  )
}

