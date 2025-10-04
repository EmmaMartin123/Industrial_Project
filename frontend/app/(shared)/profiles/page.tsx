"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { Profile } from "@/lib/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import * as Button from "@/components/Button";

export default function ProfilesListPage() {
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const { getId } = useAuthStore();
	const authUserId = getId();

	// fetch all profiles
	useEffect(() => {
		async function fetchProfiles() {
			try {
				const response = await axiosInstance.get("/profile");
				setProfiles(response.data);
			} catch (err: any) {
				console.error("Failed to fetch profiles:", err.response?.data || err.message);
			}
		}
		fetchProfiles();
	}, []);

	if (!profiles.length) {
		return <p className="text-center mt-10">Loading profiles...</p>;
	}

	return (
		<div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{profiles.map((profile) => {
				const isMine = authUserId !== null && profile.id.toString() === authUserId;

				return (
					<Card key={profile.id} className="shadow-sm">
						<CardHeader className="flex flex-col items-center gap-2 p-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={``} alt={profile.display_name} />
								<AvatarFallback>{profile.display_name.slice(0, 2)}</AvatarFallback>
							</Avatar>
							<CardTitle className="text-lg text-center">{profile.display_name}</CardTitle>
							<p className="text-muted-foreground text-sm">{profile.role}</p>
							<div className="flex gap-2 mt-1">
								<Badge variant="secondary">Premium</Badge>
							</div>
						</CardHeader>
						<CardContent className="flex flex-col items-center gap-3 p-4">
							<p className="text-muted-foreground text-sm">Dashboard Balance</p>
							<p className="font-semibold text-lg">${profile.dashboard_balance}</p>
							<div className="flex gap-2 mt-2">
								<button className={Button.buttonClassName}>
									Follow
								</button>
							</div>
							{isMine && <p className="text-xs text-muted-foreground mt-2">(This is you)</p>}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

