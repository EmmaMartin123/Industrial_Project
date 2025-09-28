export type User = {
	id: number;
	email: string;
	display_name: string;
	role: "Investor" | "Business" | "Admin";
	dashboard_balance: number;
	created_at: Date;
};
