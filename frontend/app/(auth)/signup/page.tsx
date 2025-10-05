"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { LoaderPinwheel } from "lucide-react"

import { useAuthStore } from "@/lib/store/authStore"
import { postUserProfile } from "@/lib/api/profile"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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
	const [businessName, setBusinessName] = useState("")
	const [investmentFocus, setInvestmentFocus] = useState("")

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if logged in
	useEffect(() => {
		if (authUser) {
			router.push("/")
		}
	}, [authUser, router])

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name || !email || !password || !role) {
			return toast.error("Please fill in all required fields.")
		}

		if (role === ROLES.BUSINESS && !businessName) {
			return toast.error("Please enter your business name.")
		}
		if (role === ROLES.INVESTOR && !investmentFocus) {
			return toast.error("Please enter your investment focus.")
		}

		try {
			await signup({ email, password })
			const { data: sessionData } = await supabase.auth.getSession()
			const token = sessionData?.session?.access_token
			if (token) localStorage.setItem("token", token)

			await postUserProfile({
				display_name: name,
				role,
			})

			toast.success("Signup successful! Welcome.")
			router.push("/")
		} catch (error) {
			console.error("Signup failed:", error)
			toast.error("An error occurred during signup.")
		}
	}

	const renderRoleSpecificFields = () => {
		if (role === ROLES.BUSINESS) {
			return (
				<div className="grid gap-2">
					<Label htmlFor="businessName">Business Name</Label>
					<Input
						id="businessName"
						type="text"
						placeholder="e.g. Acme Innovations"
						value={businessName}
						onChange={(e) => setBusinessName(e.target.value)}
					/>
				</div>
			)
		} else if (role === ROLES.INVESTOR) {
			return (
				<div className="grid gap-2">
					<Label htmlFor="investmentFocus">Investment Focus</Label>
					<Input
						id="investmentFocus"
						type="text"
						placeholder="e.g. Early-stage SaaS, Green Tech"
						value={investmentFocus}
						onChange={(e) => setInvestmentFocus(e.target.value)}
					/>
				</div>
			)
		}
		return null
	}

	if (isCheckingAuth && !authUser)
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
				<LoaderPinwheel className="w-10 h-10 text-primary animate-spin" />
			</div>
		)

	return (
		<div className="flex min-h-screen">
			<div className="absolute right-[60%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent backdrop-blur-sm"></div>
			{/* LEFT SIDE (FORM) */}
			<div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 bg-gray-50 dark:bg-gray-900 order-2 lg:order-1">
				<div className="max-w-md w-full mx-auto">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
						Create Account
					</h2>

					<form onSubmit={handleSignup} className="space-y-6">
						{/* Role */}
						<div className="space-y-2">
							<Label htmlFor="role">Account Type</Label>
							<select
								id="role"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value={ROLES.INVESTOR}>Investor</option>
								<option value={ROLES.BUSINESS}>Business</option>
							</select>
						</div>

						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor="name">Display Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="e.g. Ben Houghton"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						{/* Role-specific fields */}
						{renderRoleSpecificFields()}

						{/* Password */}
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						<Button
							type="submit"
							className={`w-full`}
							disabled={isSigningUp}
						>
							{isSigningUp ? (
								<LoaderPinwheel className="w-5 h-5 animate-spin" />
							) : (
								"Sign Up"
							)}
						</Button>
					</form>

					<p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
						Already have an account?{" "}
						<a
							className="text-primary hover:underline font-medium cursor-pointer"
							onClick={() => router.push("/login")}
						>
							Log in
						</a>
					</p>
				</div>
			</div>

			{/* RIGHT SIDE (VISUAL) */}
			<div className="hidden lg:flex w-[60%] bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-background items-center justify-center relative overflow-hidden order-1 lg:order-2">
				<div className="max-w-lg text-left px-12 space-y-4">
					<h1 className="text-5xl font-bold text-primary tracking-tight leading-tight">
						Join the Future of Investment
					</h1>
					<p className="text-lg text-gray-700 dark:text-gray-300">
						Create your account as an investor or business to connect, grow, and fund new opportunities.
					</p>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
			</div>
		</div>
	)
}
