"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";

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
		<Button onClick={toggleTheme} >
			{theme === "light" ? "Dark Mode" : "Light Mode"}
		</Button >
	);
}
