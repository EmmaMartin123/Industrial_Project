"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const router = useRouter()

	const handleLogin = async () => {
		if (!email || !password) {
			toast.error("Please enter both email and password")
			return
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password })

		if (error) {
			toast.error(error.message)
		} else {
			toast.success("Logged in successfully!")
			router.push("/dashboard")
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-full max-w-sm shadow-xl bg-base-100">
				<div className="card-body">
					<h2 className="card-title text-center mb-4">Login / Sign Up</h2>
					<input
						type="email"
						placeholder="Email"
						className="input input-bordered w-full mb-3"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						type="password"
						placeholder="Password"
						className="input input-bordered w-full mb-4"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<div className="flex justify-between">
						<button className="btn btn-primary rounded-md" onClick={handleLogin}>
							Login
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
