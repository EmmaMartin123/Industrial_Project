import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
const config = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				extBg: 'var(--ext-bg)',
				extFg: 'var(--ext-fg)',
				extPrimary: 'var(--ext-primary)',
			}
		},
	},
	plugins: [daisyui],
}

export default config
