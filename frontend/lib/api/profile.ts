import axios from "@/lib/axios"
import { useAuthStore } from "@/lib/store/authStore"

interface ProfileData {
	role: string;
	display_name: string;
	dashboard_balance: number;
};

export const postUserProfile = async (data: ProfileData) => {
	const response = await axios.post("/profile", data);

	return response.data;
};

export const getMyUserProfile = async (userId: string | null) => {
	if (!userId) throw new Error("User ID is missing");
	const response = await axios.get(`/profile?id=${userId}`);
	return response.data as ProfileData;
};

export const getUserProfile = async (id: number) => {
	const response = await axios.get("/profile?id=" + id);

	return response.data;
};
