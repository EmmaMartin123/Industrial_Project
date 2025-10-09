import axios from "@/lib/axios";
import { PortfolioResponse } from "@/lib/types/portfolio";

export const getPortfolio = async (): Promise<PortfolioResponse> => {
	const res = await axios.get("/portfolio");
	return res.data;
};
