import axios from "@/lib/axios"
import { useAuthStore } from "@/lib/store/authStore"

interface ProfileData {
	role: string;
	display_name: string;
};

export const postUserProfile = async (data: ProfileData) => {
	const response = await axios.post("/profile", data);

	return response.data;
};

export const getMyUserProfile = async () => {
	const { getId } = useAuthStore()

	const userId = getId(); 
	const response = await axios.get("/profile?id=" + userId);

	return response.data;
};

export const getUserProfile = async (id: number) => {
	const response = await axios.get("/profile?id=" + id);

	return response.data;
};
