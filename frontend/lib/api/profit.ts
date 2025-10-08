import axios from "@/lib/axios";
import { Profit, ProfitFromApi } from "@/lib/types/profit";
import { updatePitchStatus } from "./pitch";

export const declareProfit = async (profitData: Profit) => {
	const response = await axios.post("/profit", profitData);

	await updatePitchStatus(profitData.pitch_id, "Declared");

	return response.data;
};

export const distributeProfit = async (profitData: ProfitFromApi) => {
	console.log(profitData);
	const response = await axios.post("/distribute?profit_id=" + profitData.id);

	await updatePitchStatus(profitData.pitch_id, "Distributed");

	return response.data;
};

export const getProfitsForPitch = async (pitchId?: number): Promise<ProfitFromApi[]> => {
  let url = "/profit";
  if (pitchId) {
    url += `?pitch_id=${pitchId}`;
  }

  const response = await axios.get(url);
  
  const profits: ProfitFromApi[] = response.data.map((p: any) => ({
    id: p.id,
    pitch_id: p.pitch_id,
    declared_by: p.declared_by,
    period_start: p.period_start,
    period_end: p.period_end,
    total_profit: p.total_profit,
    distributable_amount: p.distributable_amount,
    transferred: p.transferred,
  }));

  return profits;
};
