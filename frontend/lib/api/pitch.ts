import { Pitch, NewPitch, UpdatePitch } from "@/lib/types/pitch";
import axios from "@/lib/axios";

export const getAllPitches = async (userId?: string): Promise<Pitch[]> => {
	// if a userid is provided append it as a query parameter
	const query = userId ? `?user_id=${userId}` : "";

	const response = await axios.get(`/pitch${query}`);

	// the backend returns an array of pitches in this case
	return response.data;
};

interface GetPitchesOptions {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
	sortKey?: "raisedDesc" | "raisedAsc" | "profitDesc" | "profitAsc" | "newest" | "oldest";
}

export const getPitches = async (options: GetPitchesOptions = {}): Promise<Pitch[]> => {
	const { limit, offset, search, status, sortKey } = options;

	const params = new URLSearchParams();

	if (limit) params.append("limit", limit.toString());
	if (offset) params.append("offset", offset.toString());
	if (search) params.append("search", search);
	if (status) params.append("status", status);

	// map frontend sortkey to backend query format
	if (sortKey) {
		let backendSort: string | undefined;
		switch (sortKey) {
			case "raisedDesc":
				backendSort = "price:desc";
				break;
			case "raisedAsc":
				backendSort = "price:asc";
				break;
			case "profitDesc":
				backendSort = "price:desc"; // fallback: backend only supports price
				break;
			case "profitAsc":
				backendSort = "price:asc";
				break;
			case "newest":
				backendSort = "price:desc"; // fallback
				break;
			case "oldest":
				backendSort = "price:asc"; // fallback
				break;
		}
		if (backendSort) params.append("sort", backendSort);
	}

	const response = await axios.get(`/pitch?${params.toString()}`);
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
