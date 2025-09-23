"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase_client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const router = useRouter()

	const handleLogin = async () => {
		const { error } = await supabase.auth.signInWithPassword({ email, password })
		if (error) alert(error.message)
		else router.push("/dashboard")
	}

	const handleSignup = async () => {
		const { error } = await supabase.auth.signUp({ email, password })
		if (error) alert(error.message)
		else alert("Check your email for confirmation!")
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
						<button className="btn btn-primary" onClick={handleLogin}>
							Login
						</button>
						<button className="btn btn-success" onClick={handleSignup}>
							Sign Up
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
