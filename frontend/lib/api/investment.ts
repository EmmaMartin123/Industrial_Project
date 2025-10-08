import { InvestmentFromApi } from "@/lib/types/investment";
import axios from "@/lib/axios";

export const getInvestments = async () => {
	try {
		const response = await axios.get("/investment");
		return response.data as InvestmentFromApi[];
	} catch (error) {
		console.error("Failed to fetch investments:", error);
		return [];
	}
};
