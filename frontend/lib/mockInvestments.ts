import { Investment } from "@/lib/types/investment";

export const mockInvestments: Investment[] = [
	{
		investment_id: 1,
		pitch_id: 1,
		investor_id: 1,
		amount: 5000,
		refunded: false,
		created_at: new Date("2025-09-01"),
	},
	{
		investment_id: 2,
		pitch_id: 2,
		investor_id: 1,
		amount: 2000,
		refunded: false,
		created_at: new Date("2025-09-10")
	},
	{
		investment_id: 3,
		pitch_id: 3,
		investor_id: 1,
		amount: 7500,
		refunded: false,
		created_at: new Date("2025-09-15"),
	},
];
