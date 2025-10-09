import { Pitch, NewPitch, UpdatePitch, InvestmentTier, PitchMedia, PitchListResponse } from "@/lib/types/pitch";
import axios from "@/lib/axios";

const mapPitch = (raw: any): Pitch => {
	return {
		id: raw.id,
		title: raw.title,
		elevator_pitch: raw.elevator_pitch,
		detailed_pitch: raw.detailed_pitch,
		target_amount: Number(raw.target_amount),
		raised_amount: isNaN(Number(raw.raised_amount)) ? 0 : Number(raw.raised_amount),
		profit_share_percent: Number(raw.profit_share_percent),
		status: raw.status,
		investment_start_date: new Date(raw.investment_start_date),
		investment_end_date: new Date(raw.investment_end_date),
		created_at: new Date(raw.created_at),
		updated_at: new Date(raw.updated_at),
		investment_tiers: raw.investment_tiers?.map((tier: any): InvestmentTier => ({
			tier_id: tier.tier_id,
			pitch_id: tier.pitch_id,
			name: tier.name,
			min_amount: Number(tier.min_amount),
			max_amount: tier.max_amount !== null ? Number(tier.max_amount) : undefined,
			multiplier: Number(tier.multiplier),
			created_at: new Date(tier.created_at),
		})) || [],
		media: raw.media?.map((m: any): PitchMedia => ({
			media_id: m.media_id,
			pitch_id: m.pitch_id,
			url: m.url,
			media_type: m.media_type,
			order_in_description: Number(m.order_in_description),
		})) || [],
	};
};

export const getAllPitches = async (userId?: string): Promise<Pitch[]> => {
	const query = userId ? `?user_id=${userId}` : "";
	const response = await axios.get<PitchListResponse>(`/pitch${query}`);

	const { pitches } = response.data;

	return Array.isArray(pitches) ? pitches.map(mapPitch) : [];
};

interface GetPitchesOptions {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
	sortKey?:
	| "raisedDesc"
	| "raisedAsc"
	| "profitDesc"
	| "profitAsc"
	| "newest"
	| "oldest"
	| "targetDesc"
	| "targetAsc";
}

// Updated return type:
export const getPitches = async (
	options: GetPitchesOptions = {}
): Promise<PitchListResponse> => {
	const { limit, offset, search, status, sortKey } = options;
	const params = new URLSearchParams();

	if (limit) params.append("limit", limit.toString());
	if (offset) params.append("offset", offset.toString());
	if (search) params.append("search", search);
	if (status) params.append("status", status);

	if (sortKey) {
		let backendSort: string | undefined;
		switch (sortKey) {
			case "raisedDesc":
				backendSort = "raised_amount:desc";
				break;
			case "raisedAsc":
				backendSort = "raised_amount:asc";
				break;
			case "profitDesc":
				backendSort = "profit_share_percent:desc";
				break;
			case "profitAsc":
				backendSort = "profit_share_percent:asc";
				break;
			case "newest":
				backendSort = "investment_start_date:desc";
				break;
			case "oldest":
				backendSort = "investment_start_date:asc";
				break;
			case "targetDesc":
				backendSort = "target_amount:desc";
				break;
			case "targetAsc":
				backendSort = "target_amount:asc";
				break;
		}
		if (backendSort) {
			const [field, direction] = backendSort.split(":");
			const jsonFormat = JSON.stringify({ field, direction });
			params.append("orderBy", jsonFormat);
		}
	}

	const response = await axios.get(`/pitch?${params.toString()}`);

	const rawData = response.data;
	const pitches = Array.isArray(rawData.pitches)
		? rawData.pitches.map(mapPitch)
		: [];

	const totalCount = typeof rawData.totalCount === "number" ? rawData.totalCount : 0;

	return { pitches, totalCount };
};

export const getPitchById = async (id: number): Promise<Pitch> => {
	const response = await axios.get(`/pitch?id=${id}`);
	return mapPitch(response.data);
};

export const postPitch = async (data: NewPitch | FormData): Promise<Pitch> => {
	const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
	const response = await axios.post("/pitch", data, { headers });
	return mapPitch(response.data);
};

export const patchPitch = async (id: number, data: UpdatePitch | FormData): Promise<Pitch> => {
	// Check if data is FormData to set the correct content type header
	const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};

	// The axios.put call will now correctly handle both structured JSON data and FormData
	const response = await axios.patch(`/pitch?id=${id}`, data, { headers });

	return mapPitch(response.data);
};

export const deletePitch = async (id: number): Promise<void> => {
	await axios.delete(`/pitch?id=${id}`);
};

export const updatePitchStatus = async (pitchId: number, status: string) => {
	try {
		const res = await axios.patch(`/pitch/status?id=${pitchId}`, {
			status,
		});
		return res.data;
	} catch (err: any) {
		console.error("Failed to update pitch status:", err.response?.data || err.message);
		throw err;
	}
};
