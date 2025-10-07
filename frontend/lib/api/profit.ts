import axios from "@/lib/axios";
import { Profit } from "@/lib/types/profit";

export const declareProfit = async (profitData: Profit) => {
	const response = await axios.post("/profit", profitData);
	return response.data;
};

