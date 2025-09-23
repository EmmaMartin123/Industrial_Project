"use client" // Important for client-side interactivity

import { useState } from "react"
import { supabase } from "@/lib/supabase_client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const router = useRouter()

	const login = async () => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})
		if (error) alert(error.message)
		else router.push("/dashboard") // redirect after login
	}

	const signup = async () => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		})
		if (error) alert(error.message)
		else alert("Signup successful! Check your email for confirmation.")
	}

	return (
		<div style={{ maxWidth: "400px", margin: "auto", paddingTop: "100px" }}>
			<h1>Login / Sign Up</h1>
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
			/>
			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
			/>
			<button onClick={login} style={{ marginRight: "10px", padding: "8px 16px" }}>
				Login
			</button>
			<button onClick={signup} style={{ padding: "8px 16px" }}>
				Sign Up
			</button>
		</div>
	)
}

