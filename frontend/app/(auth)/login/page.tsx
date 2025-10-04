"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

import { useAuthStore } from "@/lib/store/authStore"
import { supabase } from "@/lib/supabaseClient"
import toast from "react-hot-toast"
import * as Button from "@/components/Button"

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoaderPinwheel } from "lucide-react"

export default function LoginPage() {
	const router = useRouter()
	const { login, authUser, checkAuth, isLoggingIn, isCheckingAuth } = useAuthStore()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

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
			router.push("/investor/dashboard")
		}
	}, [authUser, router])

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault() // Prevents default form submission behavior

		if (!email || !password) {
			return window.alert("Please enter both email and password")
		}

		// login via auth store
		await login({ email, password })

		// after login get the jwt and send it to the backend
		const { data: sessionData } = await supabase.auth.getSession()
		const token = sessionData?.session?.access_token
		console.log("Token:", token)

		if (token) {
			localStorage.setItem("token", token);
		} else {
			console.warn("No JWT found after login")
		}
	}

	if (isCheckingAuth && !authUser) return (
		<div className="flex items-center justify-center h-screen">
			<LoaderPinwheel className="size-10 animate-spin" />
		</div>
	);

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
			<Card className="w-full max-w-sm mb-20">
				<CardHeader>
					<CardTitle className="text-xl">Log in</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin}>
						<div className="flex flex-col gap-6">
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							<div className="grid gap-2">
								<div className="flex items-center">
									<Label htmlFor="password">Password</Label>
								</div>
								<Input
									id="password"
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>
							<button type="submit" className={Button.buttonClassName} disabled={isLoggingIn}>
								{isLoggingIn ? (
									<LoaderPinwheel className="size-4 animate-spin" />
								) : (
									"Log in"
								)}
							</button>
						</div>
					</form>
				</CardContent>
				<CardFooter className="justify-center gap-2">
					Dont have an account?
					<a
						className="link link-primary"
						onClick={() => router.push("/signup")}
					>
						Sign up
					</a>
				</CardFooter>
			</Card>
		</div>
	)
}
