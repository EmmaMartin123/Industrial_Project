export interface Pitch {
	id: number;
	title: string;
	status: "Draft" | "Active" | "Funded";
	raised: number;
	target: number;
	profitShare: number;
}

export const mockPitches: Pitch[] = [
	{
		id: 1,
		title: "EcoBottle",
		status: "Active",
		raised: 4500,
		target: 10000,
		profitShare: 20,
	},
	{
		id: 2,
		title: "Smart Wallet",
		status: "Funded",
		raised: 12000,
		target: 12000,
		profitShare: 15,
	},
	{
		id: 3,
		title: "AI Tutor",
		status: "Draft",
		raised: 0,
		target: 8000,
		profitShare: 25,
	},
];

