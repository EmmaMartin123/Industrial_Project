"use client";

import { useState, ChangeEvent, KeyboardEvent, memo } from "react";
import toast from "react-hot-toast";
import { Plus, Trash, X, Tag, Layers, Briefcase, DollarSign, Calendar, Clapperboard } from "lucide-react";

import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { InvestmentTier } from "@/lib/types/pitch";
import { supabase } from "@/lib/supabaseClient";
import * as Button from "@/components/Button";

interface InvestmentTierInputProps {
	tier: Partial<InvestmentTier>;
	index: number;
	onChange: (index: number, field: keyof Partial<InvestmentTier>, value: string | number) => void;
	onRemove: (index: number) => void;
}

// Reusable input style class
const inputStyle = "input input-bordered rounded-lg w-full bg-base-100 border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200";
const textareaStyle = "textarea textarea-bordered w-full h-24 bg-base-100 border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200 rounded-lg";


// The InvestmentTierInput component still needs to be memoized because it's in a list.
const InvestmentTierInput: React.FC<InvestmentTierInputProps> = memo(
	({ tier, index, onChange, onRemove }) => {
		return (
			<div
				className="grid md:grid-cols-4 gap-4 items-end bg-base-100 p-4 rounded-xl border border-base-300 transition duration-200 hover:shadow-md"
			>
				<div className="form-control">
					<label className="label label-text text-xs font-semibold">Tier Name</label>
					<input
						type="text"
						placeholder="e.g., Early Bird"
						className="input input-sm input-bordered w-full focus:border-primary/50 focus:ring-primary/50"
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
						className="input input-sm input-bordered w-full focus:border-primary/50 focus:ring-primary/50"
						value={tier.min_amount || ""}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(index, "min_amount", Number(e.target.value))}
						required
						min={0}
					/>
				</div>
				<div className="form-control">
					<label className="label label-text text-xs font-semibold">Multiplier (x)</label>
					<input
						type="number"
						step="0.1"
						placeholder="Multiplier"
						className="input input-sm input-bordered w-full focus:border-primary/50 focus:ring-primary/50"
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


export default function NewPitchPage() {
	const { authUser } = useAuthStore();

	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [detailedPitchContent, setDetailedPitchContent] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState("");
	const [tiers, setTiers] = useState<Partial<InvestmentTier>[]>([
		{ name: "", min_amount: 0, multiplier: 1 },
	]);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [loading, setLoading] = useState(false);

	const ELEVATOR_MAX_LENGTH = 150;

	const handleImageUpload = () => {
		// Implementation for image upload
	};

	// tier handlers
	const handleAddTier = () => setTiers([...tiers, { name: "", min_amount: 0, multiplier: 1 }]);
	const handleRemoveTier = (index: number) => {
		if (tiers.length > 1) {
			setTiers(tiers.filter((_, i) => i !== index));
		} else {
			toast.error("You must have at least one investment tier.");
		}
	};
	const handleTierChange = (index: number, field: keyof Partial<InvestmentTier>, value: string | number) => {
		const newTiers = [...tiers];
		newTiers[index][field] = value as any;
		setTiers(newTiers);
	};

	// tag handlers
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

	// elevator pitch handler with character limit
	const handleElevatorChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		if (value.length <= ELEVATOR_MAX_LENGTH) {
			setElevator(value);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!authUser) return toast.error("You must be logged in to submit a pitch");
		if (!endDate) return toast.error("Investment end date is required");

		const invalidTiers = tiers.some(t => !t.name || Number(t.min_amount) < 0 || Number(t.multiplier) <= 0);
		if (invalidTiers) return toast.error("Please ensure all tiers have a name, non-negative min amount, and positive multiplier.");

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
					multiplier: Number(t.multiplier),
				})),
				tags,
			};

			await axiosInstance.post("/pitch", payload, {
				headers: { Authorization: `Bearer ${token}` },
			});

			toast.success("Pitch submitted successfully!");
			// reset all states on success
			setTitle("");
			setElevator("");
			setDetailedPitchContent("");
			setTargetAmount("");
			setProfitShare("");
			setEndDate("");
			setTiers([{ name: "", min_amount: 0, multiplier: 1 }]);
			setTags([]);
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const richEditorBoxStyle = "border border-base-300 rounded-lg p-2 bg-base-100 shadow-inner transition duration-200 hover:border-primary/50";


	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 p-6 flex justify-center">
			<div className="w-full max-w-3xl space-y-12">
				<h1 className="text-4xl font-extrabold text-center mb-10 mt-6">Create New Pitch</h1>

				<form onSubmit={handleSubmit} className="space-y-12">

					{/* General Information Section - Simplified by removing InputWrapper */}
					<div className="space-y-4">
						<h2 className="text-2xl font-bold flex items-center gap-3 text-primary">
							<Briefcase className="w-6 h-6" />
							General Information
						</h2>
						<p className="text-gray-500">Tell investors what your product is about. This section is key to capturing initial interest.</p>
						<div className="space-y-6">
							<div className="form-control">
								<label className="label pb-2">Product Title</label>
								<input
									type="text"
									className={inputStyle}
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									required
								/>
							</div>

							{/* elevator pitch with character counter */}
							<div className="form-control">
								<label className="label pb-2">Elevator Pitch</label>
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

							{/* detailed pitch / rich text editor placeholder */}
							<div className="form-control space-y-2">
								{/* 1. Combine Label and Button into one row with flexbox */}
								<div className="flex justify-between items-center">
									<label className="label pb-2">
										{/* The 'label' class ensures proper DaisyUI label styling */}
										<span className="label-text">Detailed Pitch</span>
									</label>

									{/* The 'Add Media' button is now aligned to the end of the same row */}
									<button
										type="button"
										className={`btn btn-ghost btn-sm text-gray-500 hover:text-primary ${Button.buttonClassName}`}
										onClick={handleImageUpload}
									>
										<Clapperboard className="w-5 h-5" />
										Add Media
									</button>
								</div>

								{/* 2. Content Area: The textarea is now directly below the label/button row.
        Removed the richEditorBoxStyle div and its internal toolbar. */}
								<textarea
									className={textareaStyle}
									placeholder="Provide a comprehensive pitch, use formatting and images to tell your story..."
									value={detailedPitchContent}
									onChange={(e) => setDetailedPitchContent(e.target.value)}
									required
								/>

								<p className="text-xs text-gray-500 pt-1">This is the heart of your pitch. Make it detailed, clear, and visually engaging!</p>
							</div>
						</div>
					</div>


					<div className="border-t border-base-300" />

					{/* Investment Details Section - Simplified by removing InputWrapper */}
					<div className="space-y-4">
						<h2 className="text-2xl font-bold flex items-center gap-3 text-primary">
							<DollarSign className="w-6 h-6" />
							Investment Details
						</h2>
						<p className="text-gray-500">Define your funding goals and the percentage of profit investors will receive.</p>
						<div className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								<div className="form-control">
									<label className="label">Target Investment (£)</label>
									<input
										type="number"
										className={inputStyle}
										value={targetAmount}
										onChange={(e) => setTargetAmount(Number(e.target.value))}
										required
										min={0}
									/>
								</div>
								<div className="form-control">
									<label className="label">Investor Profit Share (%)</label>
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
								<label className="label flex items-center gap-2">
									<Calendar className="w-4 h-4 text-gray-500" /> Investment End Date
								</label>
								<input
									type="date"
									className={inputStyle}
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									required
								/>
							</div>
						</div>
					</div>

					<div className="border-t border-base-300" />

					<div className="space-y-4">
						<h2 className="text-2xl font-bold flex items-center gap-3 text-primary">
							<Layers className="w-6 h-6" />
							Investment Tiers
						</h2>
						<p className="text-gray-500">Offer different levels of investment opportunities with corresponding multipliers.</p>
						<div className="space-y-6">
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

							<button type="button" onClick={handleAddTier} className={`${Button.buttonClassName}`}>
								<Plus /> Add Tier
							</button>
						</div>
					</div>

					<div className="border-t border-base-300" />

					<div className="space-y-4">
						<h2 className="text-2xl font-bold flex items-center gap-3 text-primary">
							<Tag className="w-6 h-6" />
							Tags
						</h2>
						<p className="text-gray-500">Add tags to help investors discover your pitch by category.</p>
						<div className="space-y-6">
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
										className={`${Button.buttonClassName}`}
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
												className="px-3 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1 transition duration-150 ease-in-out"
											>
												{tag}
												<button
													type="button"
													className="ml-1 hover:text-red-500 transition duration-150"
													onClick={() => handleRemoveTag(tag)}
												>
													<X size={14} />
												</button>
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="border-t border-base-300" />

					{/* Submit */}
					<div className="text-center py-4">
						<button
							type="submit"
							className={`${Button.buttonClassName}`}
							disabled={loading}
						>
							{loading ? "Submitting..." : "Submit Pitch"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
