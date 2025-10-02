import { Pitch } from "@/lib/types/pitch";
import axios from "@/lib/axios";

export const getAllPitches = async () => {
	const response = await axios.get("/pitch");

	return response.data;
};

export const getPitch = async (id: number) => {
	const response = await axios.get("/pitch?id=" + id);

	return response.data;
};

export const postPitch = async (data: Pitch) => {
	const response = await axios.post("/pitch", data);

	return response.data;
};

export const updatePitch = async (id: number, data: Pitch) => {
	const response = await axios.put("/pitch?id=" + id, data);

	return response.data;
};

export const deletePitch = async (id: number) => {
	const response = await axios.delete("/pitch?id=" + id);

	return response.data;
};
