"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Loader } from "lucide-react"

import { useAuthStore } from "@/lib/store/authStore"
import axios from "@/lib/axios"
import * as Button from "@/components/Button"
import { postUserProfile } from "@/lib/api/profile"
import { supabase } from "@/lib/supabaseClient"

const ROLES = {
	INVESTOR: "investor",
	BUSINESS: "business",
}

export default function SignupPage() {
	const router = useRouter()
	const { signup, authUser, checkAuth, isSigningUp, isCheckingAuth } = useAuthStore()

	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [role, setRole] = useState(ROLES.INVESTOR)

	const [businessName, setBusinessName] = useState("") // business field
	const [investmentFocus, setInvestmentFocus] = useState("") // investor field

	useEffect(() => {
		checkAuth()
	}, [checkAuth])


	const handleSignup = async () => {
		if (!name || !email || !password || !role) {
			return toast.error("Please fill in all general fields.")
		}

		if (role === ROLES.BUSINESS && !businessName) {
			return toast.error("Please enter the business name.")
		}
		if (role === ROLES.INVESTOR && !investmentFocus) {
			return toast.error("Please enter your investment focus.")
		}

		const nameToUse = name;
		const roleToUse = role;

		try {
			// supabase auth signup
			await signup({ email, password });

			const { data: sessionData } = await supabase.auth.getSession()
			const token = sessionData?.session?.access_token
			console.log("Token:", token)

			if (token) {
				localStorage.setItem("token", token);
			} else {
				console.warn("No JWT found after login")
			}

			// post user profile
			await postUserProfile({
				display_name: nameToUse,
				role: roleToUse
			});

			toast.success("Signup successful! Welcome.");
			router.push("/");

		} catch (error) {
			toast.error("An error occurred during signup. Please try again.");
			console.error("Signup sequence failed:", error);
		}
	}

	const renderRoleSpecificFields = () => {
		if (role === ROLES.BUSINESS) {
			return (
				<>
					Business Name
					<input
						type="text"
						placeholder="e.g. Acme Innovations"
						className="input input-bordered w-full mb-3"
						value={businessName}
						onChange={(e) => setBusinessName(e.target.value)}
					/>
				</>
			)
		} else if (role === ROLES.INVESTOR) {
			return (
				<>
					Investment Focus
					<input
						type="text"
						placeholder="e.g. Early-stage SaaS, Green Tech"
						className="input input-bordered w-full mb-3"
						value={investmentFocus}
						onChange={(e) => setInvestmentFocus(e.target.value)}
					/>
				</>
			)
		}
		return null
	}

	if (isCheckingAuth && !authUser) return (
		<div className="flex items-center justify-center h-screen">
			<Loader className="size-10 animate-spin" />
		</div>
	);

	if (authUser) {
		router.push("/");
		return null;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-full max-w-sm shadow-xl bg-base-100 mb-40">
				<div className="card-body">
					<h2 className="card-title text-center text-2xl mb-4">Sign Up</h2>

					Role
					<select
						className="select select-bordered w-full mb-3"
						value={role}
						onChange={(e) => setRole(e.target.value)}
					>
						<option value={ROLES.INVESTOR}>Investor</option>
						<option value={ROLES.BUSINESS}>Business</option>
					</select>

					Display name
					<input
						type="text"
						placeholder="e.g. Ben Houghton"
						className="input input-bordered w-full mb-3"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>

					Email
					<input
						type="email"
						placeholder="e.g. ben@example.com"
						className="input input-bordered w-full mb-3"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>

					{renderRoleSpecificFields()}

					Password
					<input
						type="password"
						placeholder="Password"
						className="input input-bordered w-full mb-4"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>

					<div className="flex justify-between">
						<button
							onClick={handleSignup}
							className={`${Button.buttonClassName}`}
							disabled={isSigningUp}
						>
							{isSigningUp ? "Signing up..." : "Sign up"}
						</button>
					</div>

					<div className="text-center mt-4">
						<p className="text-center text-sm">
							Already have an account?{" "}
							<a
								className="link link-primary"
								onClick={() => router.push("/login")}
							>
								Log in
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
