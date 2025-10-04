import { Pitch, NewPitch, UpdatePitch } from "@/lib/types/pitch";
import axios from "@/lib/axios";

export const getAllPitches = async (userId?: string): Promise<Pitch[]> => {
	// if a userid is provided append it as a query parameter
	const query = userId ? `?user_id=${userId}` : "";

	const response = await axios.get(`/pitch${query}`);

	// the backend returns an array of pitches in this case
	return response.data;
};

export const getPitch = async (id: number): Promise<Pitch> => {
	const response = await axios.get(`/pitch?id=${id}`);
	return response.data;
};

export const postPitch = async (data: NewPitch | FormData): Promise<Pitch> => {
	// if it's formdata make axios not to set content type letting the browser handle multipart boundary
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
