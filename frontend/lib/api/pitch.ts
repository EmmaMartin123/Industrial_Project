// /lib/api/pitch.ts

import { Pitch, NewPitch, UpdatePitch } from "@/lib/types/pitch";
import axios from "@/lib/axios";

export const getAllPitches = async (): Promise<Pitch[]> => {
	const response = await axios.get("/pitch");
	return response.data;
};

export const getPitch = async (id: number): Promise<Pitch> => {
	const response = await axios.get(`/pitch?id=${id}`);
	return response.data;
};

// --- MODIFIED postPitch FUNCTION ---
// Now accepts FormData (which includes files) or the original NewPitch data.
// The backend expects FormData for file uploads.
export const postPitch = async (data: NewPitch | FormData): Promise<Pitch> => {
	// If it's FormData, we tell axios *not* to set Content-Type, letting the browser handle multipart boundary.
	const headers = data instanceof FormData ? {
		'Content-Type': 'multipart/form-data'
	} : {};

	const response = await axios.post("/pitch", data, {
		headers: headers,
	});
	return response.data;
};

export const updatePitch = async (id: number, data: UpdatePitch): Promise<Pitch> => {
	const response = await axios.put(`/pitch?id=${id}`, data);
	return response.data;
};

export const deletePitch = async (id: number): Promise<void> => {
	await axios.delete(`/pitch?id=${id}`);
};
