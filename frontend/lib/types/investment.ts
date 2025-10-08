export type Investment = {
	investment_id: number;
	pitch_id: number;
	investor_id: number;
	amount: number;
	refunded: boolean;
	created_at: Date;
};

export type InvestmentFromApi = {
	id: number;
	pitch_id: number;
	amount: number;
	created_at: string;
	investor_id: string;
	tier_id: number;
};
