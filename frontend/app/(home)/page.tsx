"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "@/lib/store/authStore";
import { Rocket, Users, Coins } from "lucide-react";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
	const router = useRouter()
	const pathname = usePathname()
	const { authUser, checkAuth } = useAuthStore()

	// check if user is already logged in
	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	const handleGetStarted = () => {
		if (authUser) {
			router.push("/browse");
		} else {
			router.push("/login");
		}
	};

	return (
		<div className="min-h-screen bg-base-100 text-base-content">
			<section className="hero min-h-[70vh] bg-base-100">
				<div className="hero-content text-center">
					<div className="max-w-2xl">
						<h1 className="text-5xl font-bold font-fugaz-one">
							Every Seed Deserves the Sun, Every Investor Deserves the Sky.
						</h1>
						<p className="py-6 text-lg">
							Empowering small businesses to grow and everyday investors to make an impact.
						</p>
						<div className="flex justify-center gap-4">
							<Button onClick={handleGetStarted}>Get Started</Button>
							<Button className="btn-outline rounded-md" onClick={() => router.push("/learn")}>Learn More</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="py-16 bg-base-200">
				<div className="max-w-5xl mx-auto px-4 text-center">
					<h2 className="text-3xl font-bold mb-10">Why Elevare?</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="card bg-base-100 shadow-xl p-6">
							<Rocket className="w-12 h-12 mx-auto text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								AI-Powered Pitches
							</h3>
							<p>
								Businesses get feedback and readiness ratings before going live.
							</p>
						</div>
						<div className="card bg-base-100 shadow-xl p-6">
							<Users className="w-12 h-12 mx-auto text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								Community Investing
							</h3>
							<p>Invest alongside others in exciting small businesses.</p>
						</div>
						<div className="card bg-base-100 shadow-xl p-6">
							<Coins className="w-12 h-12 mx-auto text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								Fair Profit Sharing
							</h3>
							<p>
								Distributions are transparent and tier-based, so everyone
								benefits.
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
