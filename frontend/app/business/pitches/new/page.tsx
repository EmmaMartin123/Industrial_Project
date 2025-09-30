"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash, X, Tag, Layers, Image as ImageIcon, Briefcase, DollarSign, Calendar } from "lucide-react";

import Button from "@/components/Button";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { InvestmentTier } from "@/lib/types/pitch";
import { supabase } from "@/lib/supabaseClient";

// component for a single investment tier input row
const InvestmentTierInput = ({ tier, index, onChange, onRemove }) => {
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
					onChange={(e) => onChange(index, "name", e.target.value)}
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
					onChange={(e) => onChange(index, "min_amount", Number(e.target.value))}
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
					onChange={(e) => onChange(index, "multiplier", Number(e.target.value))}
					required
					min={0}
				/>
			</div>
			<div className="flex justify-end">
				{index > 0 && (
					<button
						type="button"
						className="btn btn-error btn-sm h-full"
						onClick={() => onRemove(index)}
					>
						<Trash className="w-4 h-4" />
					</button>
				)}
			</div>
		</div>
	);
};


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

	// TODO: send image to backend
	const handleImageUpload = () => {
		
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
	const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			handleAddTag();
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
			// Reset all states on success
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

	// reusable Input Wrapper component to apply the style everywhere
	const InputWrapper = ({ title, icon: Icon, children, description }) => (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold flex items-center gap-3 text-primary">
				{Icon && <Icon className="w-6 h-6" />}
				{title}
			</h2>
			{description && <p className="text-sm text-gray-500">{description}</p>}
			<div className="space-y-6">
				{children}
			</div>
		</div>
	);

	// style classes for reuse
	const inputStyle = "input input-bordered w-full bg-base-100 border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200";
	const textareaStyle = "textarea textarea-bordered w-full h-24 bg-base-100 border-base-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-200";
	const richEditorBoxStyle = "border border-base-300 rounded-lg p-2 bg-base-100 shadow-inner transition duration-200 hover:border-primary/50";


	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 p-6 flex justify-center">
			<div className="w-full max-w-3xl space-y-12">
				<h1 className="text-4xl font-extrabold text-center mb-6">Create New Pitch</h1>

				<form onSubmit={handleSubmit} className="space-y-12">

					{/* feneral info */}
					<InputWrapper
						title="General Information"
						icon={Briefcase}
						description="Tell investors what your product is about. This section is key to capturing initial interest."
					>
						<div className="form-control">
							<label className="label font-medium">Product Title</label>
							<input
								type="text"
								className={inputStyle}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
							/>
						</div>

						<div className="form-control">
							<label className="label font-medium">Elevator Pitch</label>
							<textarea
								className={textareaStyle}
								placeholder="A concise, captivating summary (1-2 sentences)"
								value={elevator}
								onChange={(e) => setElevator(e.target.value)}
								required
							/>
						</div>

						{/* detailed Pitch / rich Text editor placeholder */}
						<div className="form-control space-y-2">
							<label className="label font-medium">Detailed Pitch</label>

							<div className={richEditorBoxStyle}>
								{/* toolbar Area */}
								<div className="flex justify-between items-center p-2 border-b border-base-300">
									<span className="text-sm text-gray-500">Rich Content Area:</span>
									{/* image upload button */}
									<button
										type="button"
										className="btn btn-sm btn-ghost text-primary hover:bg-primary/10"
										onClick={handleImageUpload}
									>
										<ImageIcon className="w-5 h-5" />
										Add Image
									</button>
								</div>

								{/* content area */}
								<textarea
									className="textarea w-full h-32 focus:ring-0 resize-y border-none bg-transparent p-2"
									placeholder="Provide a comprehensive pitch, use formatting and images to tell your story..."
									value={detailedPitchContent}
									onChange={(e) => setDetailedPitchContent(e.target.value)}
									required
								/>
							</div>
							<p className="text-xs text-gray-500 pt-1">This is the heart of your pitch. Make it detailed, clear, and visually engaging!</p>
						</div>
					</InputWrapper>

					{/* --- remember this please i need this for later --- */}
					<div className="border-t border-base-300" />

					{/* investment details section */}
					<InputWrapper
						title="Investment Details"
						icon={DollarSign}
						description="Define your funding goals and the percentage of profit investors will receive."
					>
						<div className="grid md:grid-cols-2 gap-6">
							<div className="form-control">
								<label className="label font-medium">Target Investment (£)</label>
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
								<label className="label font-medium">Investor Profit Share (%)</label>
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
							<label className="label font-medium flex items-center gap-2">
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
					</InputWrapper>

					<div className="border-t border-base-300" />

					{/* investment tiers section */}
					<InputWrapper
						title="Investment Tiers"
						icon={Layers}
						description="Offer different levels of investment opportunities with corresponding multipliers."
					>
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

						<Button type="button" onClick={handleAddTier} className="mt-4">
							<Plus /> Add Tier
						</Button>
					</InputWrapper>

					{/* tags section */}
					<InputWrapper
						title="Tags"
						icon={Tag}
						description="Add tags to help investors discover your pitch by category (e.g., Tech, Food, Real Estate)."
					>
						<div className="form-control">
							<label className="label label-text font-medium">Add Tag (Press Enter or Comma)</label>

							<div className="flex gap-2">
								<input
									type="text"
									className={inputStyle}
									placeholder="e.g., SaaS, FinTech, B2B"
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={handleTagKeyDown}
								/>
								<Button type="button" onClick={handleAddTag}>
									Add
								</Button>
							</div>
						</div>

						{tags.length > 0 && (
							<div className="pt-2">
								<label className="label label-text font-medium pb-2">Current Tags:</label>
								<div className="flex flex-wrap gap-2 p-3 bg-base-100 rounded-xl border border-base-300">
									{tags.map((tag) => (
										<span
											key={tag}
											className="px-3 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1 text-sm font-medium transition duration-150 ease-in-out"
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

					</InputWrapper>

					<div className="border-t border-base-300" />

					{/* submit */}
					<div className="text-center py-4">
						<Button
							type="submit"
							className="px-8 py-4 rounded-xl text-xl font-bold shadow-2xl transition duration-300 transform hover:scale-[1.02]"
							disabled={loading}
						>
							{loading ? "Submitting..." : "🚀 Submit Pitch"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
