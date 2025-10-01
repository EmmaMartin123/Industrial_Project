// app/business/pitches/new/page.tsx
"use client";

import { useState, ChangeEvent, KeyboardEvent, memo } from "react";
import toast from "react-hot-toast";
import { Plus, Trash, X } from "lucide-react";

import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { InvestmentTier } from "@/lib/types/pitch";
import { supabase } from "@/lib/supabaseClient";
import * as Button from "@/components/Button"; // Assuming this is needed for button styling

// Reusable styles (retained for basic look)
const inputStyle = "input input-bordered rounded-lg w-full bg-base-100 border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200";
const textareaStyle = "textarea textarea-bordered w-full h-24 bg-base-100 border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200 rounded-lg";
const richTextareaStyle = "textarea w-full h-48 bg-base-100 border border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200 rounded-lg p-4 resize-y";

// ----------------------------------------------------------------------
// InvestmentTierInput Component (Re-used for form simplicity)
// ----------------------------------------------------------------------

interface InvestmentTierInputProps {
	tier: Partial<InvestmentTier>;
	index: number;
	// Updated type to accept undefined for max_amount on change
	onChange: (index: number, field: keyof Partial<InvestmentTier>, value: string | number | undefined) => void;
	onRemove: (index: number) => void;
}

const InvestmentTierInput: React.FC<InvestmentTierInputProps> = memo(
	({ tier, index, onChange, onRemove }) => {
		return (
			<div
				className="grid md:grid-cols-5 gap-4 items-end bg-base-100 p-4 rounded-xl border border-base-300 transition duration-200 hover:shadow-md"
			>
				<div className="form-control">
					<label className="label label-text text-xs font-semibold">Tier Name</label>
					<input
						type="text"
						placeholder="e.g., Standard"
						className="input input-sm input-bordered w-full"
						value={tier.name || ""}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(index, "name", e.target.value)}
						required
					/>
				</div>
				<div className="form-control">
					<label className="label label-text text-xs font-semibold">Min Amount (£)</label>
					<input
						type="number"
						placeholder="Min £"
						className="input input-sm input-bordered w-full"
						value={tier.min_amount || ""}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(index, "min_amount", Number(e.target.value))}
						required
						min={0}
					/>
				</div>
				<div className="form-control">
					<label className="label label-text text-xs font-semibold">Max Amount (£)</label>
					<input
						type="number"
						placeholder="Max £ (Optional)"
						className="input input-sm input-bordered w-full"
						value={tier.max_amount || ""}
						onChange={(e: ChangeEvent<HTMLInputElement>) => {
							const value = e.target.value;
							onChange(index, "max_amount", value === "" ? undefined : Number(value));
						}}
						min={0}
					/>
				</div>
				<div className="form-control">
					<label className="label label-text text-xs font-semibold">Multiplier (x)</label>
					<input
						type="number"
						step="0.1"
						placeholder="Multiplier"
						className="input input-sm input-bordered w-full"
						value={tier.multiplier || 1}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(index, "multiplier", Number(e.target.value))}
						required
						min={0}
					/>
				</div>
				<div className="flex justify-end">
					{index > 0 && (
						<button
							type="button"
							className={`${Button.buttonOutlineClassName} btn-error btn-sm h-full`}
							onClick={() => onRemove(index)}
						>
							<Trash className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>
		);
	});

// ----------------------------------------------------------------------
// Main Component: NewPitchPage
// ----------------------------------------------------------------------

export default function NewPitchPage() {
	const { authUser } = useAuthStore();

	// Form State (All retained)
	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [detailedPitchContent, setDetailedPitchContent] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState("");
	const [tiers, setTiers] = useState<Partial<InvestmentTier>[]>([
		{ name: "", min_amount: 0, multiplier: 1, max_amount: undefined },
	]);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [loading, setLoading] = useState(false);

	const ELEVATOR_MAX_LENGTH = 150;

	// Handlers (All retained/modified to remove step validation)
	const handleAddTier = () => setTiers([...tiers, { name: "", min_amount: 0, multiplier: 1, max_amount: undefined }]);
	const handleRemoveTier = (index: number) => {
		if (tiers.length > 1) {
			setTiers(tiers.filter((_, i) => i !== index));
		} else {
			toast.error("You must have at least one investment tier.");
		}
	};
	// The handleTierChange logic needs to handle `undefined` for optional fields like max_amount
	const handleTierChange = (index: number, field: keyof Partial<InvestmentTier>, value: string | number | undefined) => {
		const newTiers = [...tiers];
		newTiers[index][field] = value as any;
		setTiers(newTiers);
	};

	const handleAddTag = () => {
		const newTag = tagInput.trim();
		if (newTag && !tags.includes(newTag)) {
			setTags([...tags, newTag]);
		}
		setTagInput("");
	};
	const handleRemoveTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};
	const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			handleAddTag();
		}
	};

	const handleElevatorChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		if (value.length <= ELEVATOR_MAX_LENGTH) {
			setElevator(value);
		}
	};

	// Main Submission Logic (Retained and slightly improved validation message)
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// --- All-in-one Validation ---
		if (!authUser) return toast.error("You must be logged in to submit a pitch.");
		if (!title.trim() || !elevator.trim() || !detailedPitchContent.trim()) {
			return toast.error("Please fill in the Title, Elevator Pitch, and Detailed Pitch.");
		}
		if (Number(targetAmount) <= 0 || Number(profitShare) < 0 || Number(profitShare) > 100 || !endDate) {
			return toast.error("Please provide valid Target Amount, Profit Share (0-100), and End Date.");
		}

		const invalidTiers = tiers.some(t => {
			const min = Number(t.min_amount);
			const max = t.max_amount ? Number(t.max_amount) : undefined;
			if (!t.name || min <= 0 || Number(t.multiplier) <= 0) return true;
			if (max !== undefined && max <= min) return true;
			return false;
		});

		if (invalidTiers) return toast.error("Each tier must have a name, minimum amount > £0, positive multiplier, and Max Amount must be greater than Min Amount (if set).");
		// -----------------------------

		setLoading(true);
		try {
			const token = (await supabase.auth.getSession()).data.session?.access_token;
			if (!token) {
				toast.error("Not authenticated");
				return;
			}

			const payload = {
				title,
				elevator_pitch: elevator,
				detailed_pitch: detailedPitchContent,
				target_amount: Number(targetAmount),
				investment_start_date: new Date().toISOString(),
				investment_end_date: new Date(endDate).toISOString(),
				profit_share_percent: Number(profitShare),
				investment_tiers: tiers.map((t) => ({
					name: t.name!,
					min_amount: Number(t.min_amount),
					// Converts undefined (empty input) to null for the database
					max_amount: t.max_amount !== undefined ? Number(t.max_amount) : null,
					multiplier: Number(t.multiplier),
				})),
			};

			// POST Request
			await axiosInstance.post("/pitch", payload);

			toast.success("Pitch submitted successfully!");
			// Clear form on success
			setTitle("");
			setElevator("");
			setDetailedPitchContent("");
			setTargetAmount("");
			setProfitShare("");
			setEndDate("");
			setTiers([{ name: "", min_amount: 0, multiplier: 1, max_amount: undefined }]);
			setTags([]);
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-base-100 p-6 flex justify-center">
			<div className="w-full max-w-3xl space-y-8">
				<h1 className="text-4xl font-extrabold text-center text-primary">Create New Pitch</h1>
				<p className="text-center text-gray-500">Fill in all details below to submit your pitch for funding.</p>

				<form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white rounded-xl shadow-2xl">

					{/* 1. General Info */}
					<fieldset className="space-y-6 border-b pb-6">
						<legend className="text-2xl font-bold text-secondary mb-4">General Information</legend>

						<div className="form-control">
							<label className="label pb-2">Product Title*</label>
							<input
								type="text"
								className={inputStyle}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
							/>
						</div>

						<div className="form-control">
							<label className="label pb-2">Elevator Pitch*</label>
							<textarea
								className={textareaStyle}
								placeholder={`A concise, captivating summary (up to ${ELEVATOR_MAX_LENGTH} characters)`}
								value={elevator}
								onChange={handleElevatorChange}
								required
							/>
							<label className="label pt-1 pb-0">
								<span className={`label-text-alt ${elevator.length > ELEVATOR_MAX_LENGTH - 20 ? 'text-warning' : 'text-gray-500'}`}>
									{elevator.length}/{ELEVATOR_MAX_LENGTH} characters
								</span>
							</label>
						</div>

						<div className="form-control">
							<label className="label pb-2">Detailed Pitch*</label>
							<textarea
								className={richTextareaStyle}
								placeholder="Provide a comprehensive pitch, describing your product, market, and business model."
								value={detailedPitchContent}
								onChange={(e) => setDetailedPitchContent(e.target.value)}
								required
							/>
						</div>
					</fieldset>

					{/* 2. Funding Details */}
					<fieldset className="space-y-6 border-b pb-6">
						<legend className="text-2xl font-bold text-secondary mb-4">Funding Details</legend>

						<div className="grid md:grid-cols-2 gap-6">
							<div className="form-control">
								<label className="label">Target Investment (£)*</label>
								<input
									type="number"
									className={inputStyle}
									value={targetAmount}
									onChange={(e) => setTargetAmount(Number(e.target.value))}
									required
									min={1}
								/>
							</div>
							<div className="form-control">
								<label className="label">Investor Profit Share (%)*</label>
								<input
									type="number"
									className={inputStyle}
									value={profitShare}
									onChange={(e) => setProfitShare(Number(e.target.value))}
									required
									min={0}
									max={100}
								/>
							</div>
						</div>

						<div className="form-control">
							<label className="label">Investment End Date*</label>
							<input
								type="date"
								className={inputStyle}
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								required
							/>
						</div>
					</fieldset>

					{/* 3. Investment Tiers */}
					<fieldset className="space-y-6 border-b pb-6">
						<legend className="text-2xl font-bold text-secondary mb-4">Investment Tiers</legend>
						<p className="text-sm text-gray-500">Define the minimum amount and multiplier for each tier.</p>

						<div className="space-y-4">
							{tiers.map((tier, index) => (
								<InvestmentTierInput
									key={index}
									tier={tier}
									index={index}
									onChange={handleTierChange}
									onRemove={handleRemoveTier}
								/>
							))}
						</div>

						<button type="button" onClick={handleAddTier} className={`${Button.buttonOutlineClassName} text-primary border-primary/50 hover:bg-primary/10`}>
							<Plus /> Add Tier
						</button>
					</fieldset>

					{/* 4. Tags and Submit */}
					<fieldset className="space-y-6">
						<legend className="text-2xl font-bold text-secondary mb-4">Tags</legend>

						<div className="form-control">
							<label className="label label-text">Add Tag (Press Enter or Comma)</label>
							<div className="flex gap-2">
								<input
									type="text"
									className={inputStyle}
									placeholder="e.g., SaaS, FinTech, B2B"
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={handleTagKeyDown}
								/>
								<button type="button" onClick={handleAddTag}
									className={`${Button.buttonClassName} flex-shrink-0`}
								>
									Add
								</button>
							</div>
						</div>

						{tags.length > 0 && (
							<div className="pt-2">
								<label className="label label-text pb-2">Current Tags:</label>
								<div className="flex flex-wrap gap-2 p-3 bg-base-100 rounded-xl border border-base-300">
									{tags.map((tag) => (
										<span
											key={tag}
											className="px-3 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1"
										>
											{tag}
											<button
												type="button"
												className="ml-1 hover:text-red-500"
												onClick={() => handleRemoveTag(tag)}
											>
												<X size={14} />
											</button>
										</span>
									))}
								</div>
							</div>
						)}

						<div className="pt-8 text-center">
							<button
								type="submit"
								className={`${Button.buttonClassName} btn-lg w-full max-w-sm`}
								disabled={loading}
							>
								{loading ? (
									<span className="loading loading-spinner"></span>
								) : (
									<>Submit Pitch</>
								)}
							</button>
						</div>
					</fieldset>

				</form>
			</div>
		</div>
	);
}
