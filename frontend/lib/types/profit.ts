export type Profit = {
	pitch_id: number, 
  total_profit: number, 
	period_start: string, 
	period_end: string
};

export type ProfitFromApi = {
	id: number;
	pitch_id: number;
	declared_by: string;
	period_start: string;
	period_end: string;
	total_profit: number;
	distributable_amount: number;
	transferred: boolean;
};
