import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type AuthData = {
  email: string
  password: string
}

export const useAuthStore = create((set) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isCheckingAuth: true,

	// check if user is already logged in
	checkAuth: async () => {
		set({ isCheckingAuth: true });
		try {
			const { data: { session }, error } = await supabase.auth.getSession();
			if (error) throw error;
			set({ authUser: session?.user ?? null });
		} catch (err) {
			console.log("Error checking auth:", err);
			set({ authUser: null });
		} finally {
			set({ isCheckingAuth: false });
		}
	},

	// signup
	signUp: async ({ email, password }: AuthData) => {
		set({ isSigningUp: true });
		try {
			const { data, error } = await supabase.auth.signUp({ email, password });
			if (error) throw error;
			toast.success("Check your email for confirmation!");
			set({ authUser: data.user ?? null });
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			set({ isSigningUp: false });
		}
	},

	// login
	login: async ({ email, password }: AuthData) => {
		set({ isLoggingIn: true });
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			toast.success("Logged in successfully!");
			set({ authUser: data.user });
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			set({ isLoggingIn: false });
		}
	},

	// logout
	logout: async () => {
		try {
			await supabase.auth.signOut();
			set({ authUser: null });
			toast.success("Logged out successfully");
		} catch (err: any) {
			toast.error(err.message);
		}
	},
}));

