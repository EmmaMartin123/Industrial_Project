import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
const config = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
	],
	darkMode: "class", // class based dark mode
	theme: {
		extend: {},
	},
	plugins: [daisyui],
	daisyui: {
		themes: ["light", "dark"],
	},
}

export default config
