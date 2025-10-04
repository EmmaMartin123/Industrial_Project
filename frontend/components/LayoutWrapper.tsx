"use client";

import { usePathname } from "next/navigation";
import React from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";

export default function LayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	// define paths where the navbar and footer should be hidden
	const NO_LAYOUT_PATHS = ["/login", "/signup"];

	// check if the current pathname is one of the paths where the layout should be minimal
	const isMinimalLayout = NO_LAYOUT_PATHS.includes(pathname);

	return (
		<body className="font-lato">
			{!isMinimalLayout && <Navbar />}

			{children}

			<Toaster position="top-center" />

			{!isMinimalLayout && <Footer />}
		</body>
	);
}

