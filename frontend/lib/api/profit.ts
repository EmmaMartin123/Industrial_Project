import axios from "@/lib/axios";
import { Profit } from "@/lib/types/profit";
import { updatePitchStatus } from "./pitch";

export const declareProfit = async (profitData: Profit) => {
	const response = await axios.post("/profit", profitData);

	await updatePitchStatus(profitData.pitch_id, "Declared");

	return response.data;
};

export const distributeProfit = async (profitData: Profit) => {
	const response = await axios.post("/profit/distribute", profitData);

	await updatePitchStatus(profitData.pitch_id, "Distributed");

	return response.data;
};

