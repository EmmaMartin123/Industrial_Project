export type PitchMedia = {
	media_id: number;
	pitch_id: number;
	url: string;
	media_type: string;
	order_in_description: number;
};

// return from backend
export type Pitch = {
	pitch_id: number;
	title: string;
	elevator_pitch: string;
	detailed_pitch: string;
	target_amount: number;
	raised_amount: number;
	profit_share_percent: number;
	status: string;
	investment_start_date: Date;
	investment_end_date: Date;
	created_at: Date;
	updated_at: Date;
	investment_tiers?: InvestmentTier[];
	media?: PitchMedia[];
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

// for creating new pitch
export type NewPitch = {
	title: string;
	elevator_pitch: string;
	detailed_pitch: string;
	target_amount: number;
	profit_share_percent: number;
	investment_start_date: string;
	investment_end_date: string;
	investment_tiers: {
		name: string;
		min_amount: number;
		max_amount?: number | null;
		multiplier: number;
	}[];
};

// ✅ For updating, you might allow partial updates
export type UpdatePitch = Partial<NewPitch>;
