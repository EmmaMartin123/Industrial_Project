"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useEffect } from "react"

export default function DashboardPage() {
	const router = useRouter()
	const { authUser, checkAuth } = useAuthStore()

	// check if visitor is authenticated / logged in
	// this updates authUser variable, either empty, or with user data
	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	// if not logged in, redirect to login page
	useEffect(() => {
		if (!authUser) router.push("/login")
	}, [authUser, router])

  return (
    <div>
			<h1>Dashboard</h1>
			<h3>Welcome {authUser?.email}</h3>
		</div>
  )
}

