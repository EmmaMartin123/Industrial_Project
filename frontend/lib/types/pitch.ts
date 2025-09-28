export type Pitch = {
  pitch_id: number;
  title: string;
  elevator_pitch: string;
  detailed_pitch: string;
  target_amount: number;
	raised_amount: number;
  profit_share_percent: number;
	status: "Active" | "Draft" | "Funded";
	investment_start_date: Date;
	investment_end_date: Date;
	created_at: Date;
	updated_at: Date;

  investment_tiers?: InvestmentTier[];
};

export type InvestmentTier = {
	tier_id: number;
	pitch_id: number;
	name: string;
	min_amount: number;
	max_amount: number;
	multiplier: number;
	created_at: Date;
};

