"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { Profile } from "@/lib/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const router = useRouter();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [activeTab, setActiveTab] = useState("overview");

	// check if this profile is the logged in user's profile
	const isMine = authUser?.id !== null && profile?.id.toString() === authUser?.id;

	return (
		<div className="max-w-5xl mx-auto p-6 space-y-8">
			<Card className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
				<Avatar className="h-24 w-24">
					<AvatarImage src={``} alt="User" />
					<AvatarFallback>{profile?.display_name.slice(0, 2)}</AvatarFallback>
				</Avatar>
				<div className="flex-1 space-y-2 text-center md:text-left">
					<CardTitle className="text-2xl">{profile?.display_name}</CardTitle>
					<p className="text-muted-foreground">{profile?.role}</p>
					<div className="flex gap-2 justify-center md:justify-start mt-2">
						<Badge variant="secondary">Premium Member</Badge>
						<Badge variant="outline">Active</Badge>
					</div>
					<div className="flex gap-3 justify-center md:justify-start mt-4">
						<Button variant="default" disabled={isMine}>
							Follow
						</Button>
						<Button variant="outline" disabled={isMine}>
							Message
						</Button>
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-4 text-center">
						<p className="text-muted-foreground text-sm">Investments</p>
						<p className="text-xl font-semibold">{profile?.dashboard_balance}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<p className="text-muted-foreground text-sm">Followers</p>
						<p className="text-xl font-semibold">1,248</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<p className="text-muted-foreground text-sm">Following</p>
						<p className="text-xl font-semibold">324</p>
					</CardContent>
				</Card>
			</div>

			<Separator />

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-3 max-w-md mx-auto mb-6">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="activity">Activity</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<Card>
						<CardHeader>
							<CardTitle>About</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground leading-relaxed">
								{profile?.display_name} is a {profile?.role}. Dashboard balance: ${profile?.dashboard_balance}.
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="activity">
					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="list-disc pl-6 space-y-2 text-muted-foreground">
								<li>Invested $5,000 in SolarTech startup</li>
								<li>Followed Jane Smith</li>
								<li>Shared a pitch about AI in healthcare</li>
							</ul>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="settings">
					<Card>
						<CardHeader>
							<CardTitle>Settings</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button variant="default" className="w-full" disabled={!isMine}>
								Edit Profile
							</Button>
							<Button variant="outline" className="w-full" disabled={!isMine}>
								Manage Subscription
							</Button>
							<Button variant="destructive" className="w-full" disabled={!isMine}>
								Log Out
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
