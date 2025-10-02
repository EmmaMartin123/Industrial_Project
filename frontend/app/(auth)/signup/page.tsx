"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Loader } from "lucide-react"

import { useAuthStore } from "@/lib/store/authStore"
import axios from "@/lib/axios"
import * as Button from "@/components/Button"

// Define the two role choices
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
	// New state for the selected role
	const [role, setRole] = useState(ROLES.INVESTOR) // Default to investor

	// States for the role-dependent fields
	const [businessName, setBusinessName] = useState("") // Business field
	const [investmentFocus, setInvestmentFocus] = useState("") // Investor field

	// Check if user is already logged in on mount
	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	// Redirect to dashboard if already logged in
	useEffect(() => {
		if (authUser) router.push("/dashboard")
	}, [authUser, router])

	const handleSignup = () => {
		// Base validation
		if (!name || !email || !password || !role) {
			return toast.error("Please fill in all general fields.")
		}

		// Role-specific validation
		if (role === ROLES.BUSINESS && !businessName) {
			return toast.error("Please enter the business name.")
		}
		if (role === ROLES.INVESTOR && !investmentFocus) {
			return toast.error("Please enter your investment focus.")
		}

		// Assemble the data payload
		const signupData = {
			name,
			email,
			password,
			role,
			// Include role-specific data only if present
			...(role === ROLES.BUSINESS && { businessName }),
			...(role === ROLES.INVESTOR && { investmentFocus }),
		}

		signup(signupData)
	}

	// Function to render role-specific fields
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

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-full max-w-sm shadow-xl bg-base-100 mb-40">
				<div className="card-body">
					<h2 className="card-title text-center text-2xl mb-4">Sign Up</h2>

					{/* Role Selection Field */}
					Role
					<select
						className="select select-bordered w-full mb-3"
						value={role}
						onChange={(e) => setRole(e.target.value)}
					>
						<option value={ROLES.INVESTOR}>Investor</option>
						<option value={ROLES.BUSINESS}>Business</option>
					</select>

					{/* General Fields */}
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

					{/* Dynamic Fields based on Role */}
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
