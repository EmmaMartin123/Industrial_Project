export interface PortfolioItem {
	investment_id: number;
	pitch_id: number;
	pitch_title: string;
	target_amount: number;
	raised_amount: number;
	status: string;
	multiplier: number;
	total_profit: number;
	roi: number;
	created_at: string;
}

export interface PortfolioResponse {
	investor_id: string;
	items: PortfolioItem[];
}

