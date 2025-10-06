export type Profile = {
	id: number;
	role: string;
	display_name: string;
	dashboard_balance: number;
	email: string;
};

export type ProfileToSend = {
	role: string;
	display_name: string;
	dashboard_balance: number;
};
