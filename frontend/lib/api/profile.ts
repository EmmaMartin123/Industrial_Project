import axios from "@/lib/axios"
import { useAuthStore } from "@/lib/store/authStore"
import { Profile, ProfileToSend } from "@/lib/types/profile"

export const postUserProfile = async (data: ProfileToSend) => {
	const response = await axios.post("/profile", data);

	return response.data;
};

export const getMyUserProfile = async (userId: string | null) => {
	if (!userId) throw new Error("User ID is missing");
	const response = await axios.get(`/profile?id=${userId}`);
	return response.data as Profile;
};

export const getUserProfile = async (id: number) => {
	const response = await axios.get("/profile?id=" + id);

	return response.data;
};
