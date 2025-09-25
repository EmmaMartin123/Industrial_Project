"use client"

import { useAuthStore } from "@/store/authStore"

export default function DashboardPage() {
	const { authUser } = useAuthStore()

  return (
    <div>
			<h1>Dashboard</h1>
			<h3>Welcome {authUser?.email}</h3>
		</div>
  )
}

