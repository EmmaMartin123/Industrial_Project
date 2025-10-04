"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { LoaderPinwheel } from "lucide-react" // Changed from Loader for consistency

import { useAuthStore } from "@/lib/store/authStore"
import axios from "@/lib/axios"
import * as Button from "@/components/Button" // Assuming this holds buttonClassName
import { postUserProfile } from "@/lib/api/profile"
import { supabase } from "@/lib/supabaseClient"

// Using the same UI components as the Login page
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


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

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/")
		}
	}, [authUser, router])

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault()

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

	if (isCheckingAuth && !authUser) return (
		<div className="flex items-center justify-center h-screen">
			{/* Using LoaderPinwheel for consistency with new Login page */}
			<LoaderPinwheel className="size-10 animate-spin" />
		</div>
	);

	return (
		// Centering container matching LoginPage
		<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					{/* Using a larger text size, slightly smaller than the login page for more compact form */}
					<CardTitle className="text-2xl font-bold">Create Account</CardTitle>
					<CardDescription>
						Join our platform as an Investor or Business.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSignup} className="grid gap-4">
						{/* Role Select */}
						<div className="grid gap-2">
							<Label htmlFor="role">Account Type</Label>
							{/* Native select styled to match Input component */}
							<select
								id="role"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								value={role}
								onChange={(e) => setRole(e.target.value)}
							>
								<option value={ROLES.INVESTOR}>Investor</option>
								<option value={ROLES.BUSINESS}>Business</option>
							</select>
						</div>

						{/* Display Name */}
						<div className="grid gap-2">
							<Label htmlFor="name">Display Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="e.g. Ben Houghton"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>

						{/* Email */}
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="e.g. ben@example.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						{/* Role Specific Fields (Business Name or Investment Focus) */}
						{renderRoleSpecificFields()}

						{/* Password */}
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							className={Button.buttonClassName} // Using the imported custom button class
							disabled={isSigningUp}
						>
							{isSigningUp ? (
								<LoaderPinwheel className="size-4 animate-spin mr-2" />
							) : (
								"Sign Up"
							)}
						</button>
					</form>
				</CardContent>

				<CardFooter className="flex justify-center text-sm">
					<p className="text-center text-sm text-gray-500 dark:text-gray-400">
						Already have an account?{" "}
						<a
							className="text-primary-600 hover:text-primary-700 font-medium underline cursor-pointer"
							onClick={() => router.push("/login")}
						>
							Log in
						</a>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}
