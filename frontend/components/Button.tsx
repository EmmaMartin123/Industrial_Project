"use client"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	isLoading?: boolean
	loadingText?: string
}

export default function Button({
	children,
	className = "",
	isLoading,
	loadingText,
	...props
}: ButtonProps) {
	const baseStyles = "btn px-4 py-2"
	const defaultStyles = "btn-primary rounded-md"

	return (
		<button
			className={`${baseStyles} ${className || defaultStyles}`}
			disabled={isLoading || props.disabled}
			{...props}
		>
			{isLoading ? loadingText || "Loading..." : children}
		</button>
	)
}
