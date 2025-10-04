"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { PlusCircle, Users, Coins } from "lucide-react";

export default function BusinessDashboard() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-base-100 p-6 flex flex-col items-center gap-6">
			<h1 className="text-4xl font-bold mb-6">Business Dashboard</h1>

			<div className="flex flex-col gap-4 w-full max-w-lg">
				{/* New Pitch */}
				<Item>
					<ItemContent className="flex items-center gap-2">
						<PlusCircle />
						<div>
							<ItemTitle>New Pitch</ItemTitle>
							<ItemDescription>Create a new pitch to attract investors.</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/new")}
						>
							Open
						</Button>
					</ItemActions>
				</Item>

				{/* Manage Pitches */}
				<Item>
					<ItemContent className="flex items-center gap-2">
						<Users />
						<div>
							<ItemTitle>Manage Pitches</ItemTitle>
							<ItemDescription>Edit or review your existing pitches.</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/manage")}
						>
							Open
						</Button>
					</ItemActions>
				</Item>

				{/* Profit Distribution */}
				<Item>
					<ItemContent className="flex items-center gap-2">
						<Coins />
						<div>
							<ItemTitle>Profit Distribution</ItemTitle>
							<ItemDescription>View and distribute profits from successful pitches.</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/profit-distribution")}
						>
							Open
						</Button>
					</ItemActions>
				</Item>
			</div>
		</div>
	);
}
