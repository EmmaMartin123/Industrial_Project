"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderPinwheel } from "lucide-react"
import { useAuthStore } from "@/lib/store/authStore"
import { postUserProfile } from "@/lib/api/profile"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// defines user roles as constants
const ROLES = {
	INVESTOR: "investor",
	BUSINESS: "business",
}

export default function SignupPage() {
	// initialise router and destructure state/actions from global auth store
	const router = useRouter()
	const { signup, authUser, checkAuth, isSigningUp, isCheckingAuth } = useAuthStore()
	// local component state for standard sign-up fields
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [role, setRole] = useState(ROLES.INVESTOR)
	// local component state for role-specific fields
	const [businessName, setBusinessName] = useState("")
	const [investmentFocus, setInvestmentFocus] = useState("")

	// effect to verify user authentication status on component mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// effect to redirect user to home page if already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/")
		}
	}, [authUser, router])

	// handles form submission for user sign-up
	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault()

		// validation for required base fields
		if (!name || !email || !password || !role) {
			return toast.error("please fill in all required fields.")
		}

		// validation for role-specific fields
		if (role === ROLES.BUSINESS && !businessName) {
			return toast.error("please enter business name.")
		}
		if (role === ROLES.INVESTOR && !investmentFocus) {
			return toast.error("please enter investment focus.")
		}

		try {
			// attempt to create new user account via auth store
			await signup({ email, password })
			// get session token and store in local storage
			const { data: sessionData } = await supabase.auth.getSession()
			const token = sessionData?.session?.access_token
			if (token) localStorage.setItem("token", token)

			// create new user profile in database
			await postUserProfile({
				role,
				display_name: name,
				dashboard_balance: 0,
			})

			// notify success and redirect user to login
			toast.success("sign-up successful! welcome.")
			router.push("/login")
		} catch (error) {
			console.error("sign-up failed:", error)
			toast.error("an error occurred during sign-up.")
		}
	}

	// conditionally renders input fields based on selected role
	const renderRoleSpecificFields = () => {
		if (role === ROLES.BUSINESS) {
			return (
				<div className="grid gap-2">
					<Label htmlFor="businessName">business name</Label>
					<Input
						id="businessName"
						type="text"
						placeholder="e.g. acme innovations"
						value={businessName}
						onChange={(e) => setBusinessName(e.target.value)}
					/>
				</div>
			)
		} else if (role === ROLES.INVESTOR) {
			return (
				<div className="grid gap-2">
					<Label htmlFor="investmentFocus">investment focus</Label>
					<Input
						id="investmentFocus"
						type="text"
						placeholder="e.g. early-stage saas, green tech"
						value={investmentFocus}
						onChange={(e) => setInvestmentFocus(e.target.value)}
					/>
				</div>
			)
		}
		return null
	}

	// render fullscreen loading spinner while auth status is checked
	if (isCheckingAuth && !authUser)
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
				<LoaderPinwheel className="w-10 h-10 text-primary animate-spin" />
			</div>
		)

	// main component return: renders twocolumn sign-up layout
	return (
		<div className="flex min-h-screen">
			{/* decorative visual line */}
			<div className="absolute right-[60%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent backdrop-blur-sm"></div>

			{/* left side (form) */}
			<div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 bg-gray-50 dark:bg-gray-900 order-2 lg:order-1">
				<div className="max-w-md w-full mx-auto">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
						create account
					</h2>

					{/* the sign-up form */}
					<form onSubmit={handleSignup} className="space-y-6">
						{/* role selection dropdown */}
						<div className="space-y-2">
							<Label htmlFor="role">account type</Label>
							<select
								id="role"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value={ROLES.INVESTOR}>investor</option>
								<option value={ROLES.BUSINESS}>business</option>
							</select>
						</div>

						{/* name input field */}
						<div className="space-y-2">
							<Label htmlFor="name">display name</Label>
							<Input
								id="name"
								type="text"
								placeholder="e.g. ben houghton"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						{/* email input field */}
						<div className="space-y-2">
							<Label htmlFor="email">email</Label>
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

						{/* role-specific fields rendered here */}
						{renderRoleSpecificFields()}

						{/* password input field */}
						<div className="space-y-2">
							<Label htmlFor="password">password</Label>
							<Input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						{/* submit button with loading state */}
						<Button
							type="submit"
							className={`w-full`}
							disabled={isSigningUp}
						>
							{isSigningUp ? (
								<LoaderPinwheel className="w-5 h-5 animate-spin" />
							) : (
								"sign up"
							)}
						</Button>
					</form>

					{/* link to login page */}
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
						already have account?{" "}
						<a
							className="text-primary hover:underline font-medium cursor-pointer"
							onClick={() => router.push("/login")}
						>
							log in
						</a>
					</p>
				</div>
			</div>

			{/* right side (visual/marketing panel) */}
			<div className="hidden lg:flex w-[60%] bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-background items-center justify-center relative overflow-hidden order-1 lg:order-2">
				<div className="max-w-lg text-left px-12 space-y-4">
					<h1 className="text-5xl font-bold text-primary tracking-tight leading-tight">
						join future of investment
					</h1>
					<p className="text-lg text-gray-700 dark:text-gray-300">
						create user account as investor or business to connect, grow, and fund new opportunities.
					</p>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
			</div>
		</div>
	)
}
