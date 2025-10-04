"use client";

import { LoaderPinwheel } from "lucide-react";

export default function LoaderComponent() {
	return (
		<div className="flex items-center justify-center h-screen">
			<LoaderPinwheel className="size-10 animate-spin" />
		</div>
	);
}
