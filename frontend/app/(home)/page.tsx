"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Rocket, Users, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
	// initialise next.js router
	const router = useRouter()
	// access user authentication state and checkauth function from zustand store
	const { authUser } = useAuthStore()

	// handles 'get started' button click: redirects user based on auth status
	const handleGetStarted = () => {
		if (authUser) {
			// redirect logged-in user to pitches dashboard
			router.push("/pitches");
		} else {
			// redirect unauthenticated user to login page
			router.push("/login");
		}
	};

	// main home page structure
	return (
		<div className="min-h-screen bg-base-100 text-base-content">
			{/* hero section for main heading and call-to-action */}
			<section className="hero min-h-[70vh] bg-base-100">
				<div className="hero-content text-center">
					<div className="max-w-2xl">
						<h1 className="text-5xl font-bold font-fugaz-one">
							every seed deserves sun, every investor deserves sky.
						</h1>
						<p className="py-6 text-lg">
							empowering small businesses to grow and everyday investors to make impact.
						</p>
						{/* call-to-action buttons */}
						<div className="flex justify-center gap-4">
							<Button className="cursor-pointer" onClick={handleGetStarted}>get started</Button>
							<Button className="cursor-pointer" variant="outline" onClick={() => router.push("/browse")}>browse pitches</Button>
						</div>
					</div>
				</div>
			</section>

			{/* features section explaining platform benefits */}
			<section className="py-16 bg-base-200">
				<div className="max-w-5xl mx-auto px-4 text-center">
					<h2 className="text-3xl font-bold mb-10">why elevare?</h2>
					{/* three feature cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* feature 1: ai pitches */}
						<div className="card bg-base-100 shadow-xl p-6">
							<Rocket className="w-12 h-12 mx-auto text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								ai-powered pitches
							</h3>
							<p>
								businesses get feedback and readiness ratings before going live.
							</p>
						</div>
						{/* feature 2: community investing */}
						<div className="card bg-base-100 shadow-xl p-6">
							<Users className="w-12 h-12 mx-auto text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								community investing
							</h3>
							<p>invest alongside others in exciting small businesses.</p>
						</div>
						{/* feature 3: profit sharing */}
						<div className="card bg-base-100 shadow-xl p-6">
							<Coins className="w-12 h-12 mx-auto text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">
								fair profit sharing
							</h3>
							<p>
								distributions are transparent and tier-based, so everyone
								benefits.
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
