// NewPitchPage.tsx

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash } from "lucide-react";

import { NewPitch } from "@/lib/types/pitch"; // Removed InvestmentTier as we use a local TierState
import { postPitch } from "@/lib/api/pitch";

// Define a type for the tier state
type TierState = {
	name: string;
	min_amount: number | "";
	max_amount?: number | "" | null | undefined;
	multiplier: number | "";
};

export default function NewPitchPage() {
	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [detailedPitchContent, setDetailedPitchContent] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState("");

	// NEW STATE for media files
	const [mediaFiles, setMediaFiles] = useState<File[]>([]);

	const [tiers, setTiers] = useState<TierState[]>([
		{ name: "", min_amount: "", multiplier: "", max_amount: "" },
	]);
	const [loading, setLoading] = useState(false);

	// --- Tier Handlers (omitted for brevity, assume they are correct from last step) ---
	const handleTierChange = (
		index: number,
		field: keyof TierState,
		value: string | number
	) => {
		const newTiers = [...tiers];
		if (field === "name") {
			newTiers[index][field] = value as string;
		} else {
			newTiers[index][field] = value === "" ? "" : Number(value);
		}
		setTiers(newTiers);
	};

	const addTier = () => {
		setTiers([...tiers, { name: "", min_amount: "", multiplier: "", max_amount: "" }]);
	};

	const removeTier = (index: number) => {
		const newTiers = tiers.filter((_, i) => i !== index);
		setTiers(newTiers);
	};
	// --- End Tier Handlers ---

	// NEW HANDLER for media file selection
	const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			// Converts FileList to an array and sets the state
			setMediaFiles(Array.from(e.target.files));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// 1. Basic Field Validation
		if (!title.trim() || !elevator.trim() || !detailedPitchContent.trim()) {
			return toast.error("Please fill in all text fields.");
		}
		if (targetAmount === "" || profitShare === "" || !endDate) {
			return toast.error("Please provide valid numbers and select an End Date.");
		}
		const allTiersValid = tiers.every(
			(t) => t.name.trim() && t.min_amount !== "" && t.multiplier !== ""
		);
		if (!allTiersValid) {
			return toast.error("Please ensure all tiers have a Name, Min Amount, and Multiplier.");
		}

		// 2. Construct the NewPitch object (without media for now)
		const pitchPayload: NewPitch = {
			title,
			elevator_pitch: elevator,
			detailed_pitch: detailedPitchContent,
			target_amount: Number(targetAmount),
			investment_start_date: new Date().toISOString(),
			investment_end_date: new Date(endDate).toISOString(),
			profit_share_percent: Number(profitShare),
			// The backend is designed to handle media separately, so we send an empty array 
			// for the Media field on the initial POST unless you also had a structure for external links.
			// Based on the backend code, it handles the file uploads separately from the JSON.
			// We ensure we send an empty array for media, as the NewPitch type doesn't include it.
			// IMPORTANT: If your NewPitch type *did* include a `Media` field, you would include it here. 
			// Since it doesn't, we just build the rest of the object.

			investment_tiers: tiers.map((t) => ({
				name: t.name || "Tier",
				min_amount: Number(t.min_amount),
				max_amount: t.max_amount === "" || t.max_amount === undefined || t.max_amount === null
					? null
					: Number(t.max_amount),
				multiplier: Number(t.multiplier),
			})),
			// Note: If you need to include data about external media links, you'd add a 
			// 'media' array property here if the NewPitch type allowed it.
		};

		// 3. Construct FormData for multipart submission
		const formData = new FormData();

		// Append the main pitch data as a JSON string under the key 'pitch' (Backend requirement)
		formData.append("pitch", JSON.stringify(pitchPayload));

		// Append each selected media file under the key 'media' (Backend requirement)
		mediaFiles.forEach((file) => {
			formData.append("media", file);
		});

		// 4. API Call
		try {
			setLoading(true);
			// Send the FormData object
			await postPitch(formData);
			toast.success("Pitch submitted successfully! 🚀");
		} catch (err: any) {
			console.error(err);
			toast.error("Failed to submit pitch. Check console for details.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: 'auto', gap: '10px', padding: '20px', border: '1px solid #ccc' }}>
			<h2>Create New Pitch</h2>

			{/* Simple Fields */}
			<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
			<textarea value={elevator} onChange={(e) => setElevator(e.target.value)} placeholder="Elevator Pitch" required />
			<textarea value={detailedPitchContent} onChange={(e) => setDetailedPitchContent(e.target.value)} placeholder="Detailed Pitch" required />
			<input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Target Amount (e.g., 100000)" required />
			<input type="number" value={profitShare} onChange={(e) => setProfitShare(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Profit Share % (e.g., 10)" required />
			<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />

			<hr />

			{/* NEW MEDIA INPUT */}
			<h3>Media (Images/Videos)</h3>
			<input
				type="file"
				multiple
				accept="image/*,video/*" // Allow common image and video formats
				onChange={handleMediaChange}
			/>
			{mediaFiles.length > 0 && (
				<p>Selected Files: {mediaFiles.map(f => f.name).join(', ')}</p>
			)}

			<hr />

			{/* Investment Tiers Section (Simplified rendering) */}
			<h3>Investment Tiers</h3>
			{tiers.map((tier, index) => (
				<div key={index} style={{ border: '1px dashed #ddd', padding: '10px' }}>
					{/* ... Tier inputs remain here ... */}
					<input
						value={tier.name}
						onChange={(e) => handleTierChange(index, "name", e.target.value)}
						placeholder={`Tier ${index + 1} Name`}
						required
					/>
					<input type="number" value={tier.min_amount} onChange={(e) => handleTierChange(index, "min_amount", e.target.value)} placeholder="Min Amount" required />
					<input type="number" value={tier.max_amount === null ? "" : tier.max_amount} onChange={(e) => handleTierChange(index, "max_amount", e.target.value)} placeholder="Max Amount (Optional)" />
					<input type="number" value={tier.multiplier} onChange={(e) => handleTierChange(index, "multiplier", e.target.value)} placeholder="Multiplier" required />
					<button type="button" onClick={() => removeTier(index)} disabled={tiers.length === 1}>
						<Trash size={16} /> Remove
					</button>
				</div>
			))}

			<button type="button" onClick={addTier} style={{ marginTop: '5px' }}>
				<Plus size={16} /> Add Tier
			</button>

			<hr />

			<button type="submit" disabled={loading}>
				{loading ? "Submitting..." : "Submit Pitch"}
			</button>
		</form>
	);
}
