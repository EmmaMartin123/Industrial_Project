// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
// NOTE: Navbar and Footer imports are moved to LayoutWrapper
import { Fugaz_One } from "next/font/google";
import { Lato } from "next/font/google";
import { Toaster } from "sonner";
import LayoutWrapper from "@/components/LayoutWrapper"; // NEW IMPORT

const fugazOne = Fugaz_One({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-fugaz-one",
});

const lato = Lato({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-lato",
});

export const metadata: Metadata = {
	title: "Elevare",
	description: "Elevare is a platform for investors to invest in and grow their businesses.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={lato.variable} data-theme="light">
			<LayoutWrapper>
				{children}
			</LayoutWrapper>
		</html>
	);
}
