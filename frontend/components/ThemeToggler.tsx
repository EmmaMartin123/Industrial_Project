"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import * as Button from "@/components/Button"

export default function ThemeToggle() {
	const [theme, setTheme] = useState("light");

	useEffect(() => {
		const stored = localStorage.getItem("theme") || "light";
		setTheme(stored);
		document.documentElement.setAttribute("data-theme", stored);
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", newTheme);
		localStorage.setItem("theme", newTheme);
		setTheme(newTheme);
	};

	return (
		<button
			onClick={toggleTheme}
			className={`${Button.buttonClassName}`}
			aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
		>
			{theme === "light" ? (
				<Moon className="w-6 h-5" />
			) : (
				<Sun className="w-6 h-5" />
			)}
		</button>
	);
}
