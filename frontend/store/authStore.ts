import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type AuthUser = {
	id: string
	email: string | null
}

type AuthData = {
	email: string
	password: string
}

type AuthStore = {
	authUser: AuthUser | null
	isSigningUp: boolean
	isLoggingIn: boolean
	isCheckingAuth: boolean
	checkAuth: () => Promise<void>
	signUp: (data: AuthData) => Promise<void>
	login: (data: AuthData) => Promise<void>
	logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isCheckingAuth: true,

	checkAuth: async () => {
		set({ isCheckingAuth: true })
		try {
			const { data: { session }, error } = await supabase.auth.getSession()
			if (error) throw error
			set({ AuthUser: session?.user ?? null })
		} catch (err) {
			console.log(err)
			set({ authUser: null })
		} finally {
			set({ isCheckingAuth: false })
		}
	},

	signUp: async ({ email, password }) => {
		set({ isSigningUp: true })
		try {
			const { data, error } = await supabase.auth.signUp({ email, password })
			if (error) throw error
			toast.success("Check your email for confirmation!")
			set({ authUser: data.user ?? null })
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			set({ isSigningUp: false })
		}
	},

	login: async ({ email, password }) => {
		set({ isLoggingIn: true })
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password })
			if (error) throw error
			toast.success("Logged in successfully!")
			set({ authUser: data.user })
		} catch (err: any) {
			toast.error(err.message)
		} finally {
			set({ isLoggingIn: false })
		}
	},

	logout: async () => {
		try {
			await supabase.auth.signOut()
			set({ authUser: null })
			toast.success("Logged out successfully")
		} catch (err: any) {
			toast.error(err.message)
		}
	},
}))
