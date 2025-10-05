"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import {
	Plus,
	Trash,
	FileText,
	Image as ImageIcon,
	Video,
	X,
	Calendar as CalendarIcon,
	DollarSign,
	Percent,
	FileTextIcon,
	Wallet,
	Layers,
	GalleryVertical,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NewPitch } from "@/lib/types/pitch";
import { postPitch } from "@/lib/api/pitch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/authStore";
import router from "next/router";

// Tier type
type TierState = {
	name: string;
	min_amount: number | "";
	max_amount: number | "";
	multiplier: number | "";
};

// File icon selector
const getFileIcon = (mimeType: string) => {
	if (mimeType.startsWith("image/"))
		return <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />;
	if (mimeType.startsWith("video/"))
		return <Video className="w-4 h-4 mr-2 text-purple-500" />;
	return <FileText className="w-4 h-4 mr-2 text-gray-500" />;
};

export default function NewPitchPage() {
	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [detailedPitchContent, setDetailedPitchContent] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	const [mediaFiles, setMediaFiles] = useState<File[]>([]);
	const [tiers, setTiers] = useState<TierState[]>([
		{ name: "", min_amount: "", multiplier: "", max_amount: "" },
	]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("content");
	const investmentStartDate = new Date();

	const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
	const [aiLoading, setAiLoading] = useState(false);

	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	// auth checks
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) router.push("/login");
	}, [authUser, isCheckingAuth, router]);

	const mediaPreviews = useMemo(
		() =>
			mediaFiles.map((file) => ({
				name: file.name,
				type: file.type,
				url: URL.createObjectURL(file),
			})),
		[mediaFiles]
	);

	useEffect(() => {
		return () => {
			mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
		};
	}, [mediaFiles]);

	const handleAiAnalysis = async () => {
		try {
			setAiLoading(true);
			setAiAnalysis(null);

			// 🔥 Placeholder for API call (to be implemented later)
			// Example:
			// const res = await axios.post("/api/ai", { title, elevator, detailedPitchContent, tiers });
			// setAiAnalysis(res.data.analysis);

			// Temporary mock for now:
			await new Promise((r) => setTimeout(r, 1500));
			setAiAnalysis(
				"This pitch demonstrates strong innovation potential and clear tier structuring. Consider emphasizing your market validation more for investor confidence."
			);
		} catch (err) {
			console.error(err);
			toast.error("AI analysis failed.");
		} finally {
			setAiLoading(false);
		}
	};

	const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newFiles = e.target.files;
		if (newFiles && newFiles.length > 0) {
			setMediaFiles((prev) => [...prev, ...Array.from(newFiles)]);
			e.target.value = "";
			toast.success(`Added ${newFiles.length} new file(s).`);
		}
	};

	const removeMediaFile = (i: number) => {
		URL.revokeObjectURL(mediaPreviews[i].url);
		setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
		toast.success("Removed file.");
	};

	const handleTierChange = (i: number, field: keyof TierState, value: any) => {
		const updated = [...tiers];
		updated[i][field] = value === "" ? "" : field === "name" ? value : Number(value);
		setTiers(updated);
	};

	const addTier = () => setTiers([...tiers, { name: "", min_amount: "", multiplier: "", max_amount: "" }]);
	const removeTierHandler = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));

	const validateStep = (step: string) => {
		if (step === "content") {
			if (!title.trim() || !elevator.trim() || !detailedPitchContent.trim()) {
				toast.error("Please complete all text fields before proceeding.");
				return false;
			}
		}
		if (step === "financials") {
			if (targetAmount === "" || profitShare === "" || !endDate) {
				toast.error("Please complete all financial fields.");
				return false;
			}
			if (typeof targetAmount !== "number" || targetAmount <= 0) {
				toast.error("Target Amount must be positive.");
				return false;
			}
			if (endDate <= investmentStartDate) {
				toast.error("End date must be in the future.");
				return false;
			}
		}
		if (step === "tiers") {
			const valid = tiers.every(
				(t) =>
					t.name.trim() &&
					t.min_amount !== "" &&
					t.multiplier !== "" &&
					Number(t.min_amount) > 0 &&
					Number(t.multiplier) > 0
			);
			if (!valid) {
				toast.error("All tiers must have valid values.");
				return false;
			}
		}
		return true;
	};

	const handleNext = (current: string, next: string) => {
		if (validateStep(current)) {
			setActiveTab(next);
			window.scrollTo(0, 0);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateStep("content") || !validateStep("financials") || !validateStep("tiers")) return;

		const pitchPayload: NewPitch = {
			title,
			elevator_pitch: elevator,
			detailed_pitch: detailedPitchContent,
			target_amount: Number(targetAmount),
			investment_start_date: investmentStartDate.toISOString(),
			investment_end_date: endDate!.toISOString(),
			profit_share_percent: Number(profitShare),
			investment_tiers: tiers.map((t) => ({
				name: t.name,
				min_amount: Number(t.min_amount),
				max_amount:
					t.max_amount === "" || t.max_amount === undefined || t.max_amount === null
						? null
						: Number(t.max_amount),
				multiplier: Number(t.multiplier),
			})),
		};

		const formData = new FormData();
		formData.append("pitch", JSON.stringify(pitchPayload));
		mediaFiles.forEach((f) => formData.append("media", f));

		try {
			setLoading(true);
			await postPitch(formData);
			toast.success("Pitch submitted successfully! 🚀");
		} catch (err) {
			console.error(err);
			toast.error("Submission failed.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
			<div>
				<h1 className="text-3xl font-semibold tracking-tight">Create New Pitch</h1>
				<p className="text-muted-foreground mt-1">
					Follow the steps below to describe and submit your investment proposal.
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="w-full justify-start border-b rounded-none p-0 mb-8 bg-transparent">
					<TabsTrigger
						value="content"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm"
					>
						<FileTextIcon className="w-4 h-4 mr-2" /> Content
					</TabsTrigger>
					<TabsTrigger
						value="media"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm"
					>
						<GalleryVertical className="w-4 h-4 mr-2" /> Media
					</TabsTrigger>
					<TabsTrigger
						value="financials"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm"
					>
						<Wallet className="w-4 h-4 mr-2" /> Financials
					</TabsTrigger>
					<TabsTrigger
						value="tiers"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm"
					>
						<Layers className="w-4 h-4 mr-2" /> Tiers
					</TabsTrigger>
					<TabsTrigger
						value="overview"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm"
					>
						<FileText className="w-4 h-4 mr-2" /> Overview
					</TabsTrigger>
				</TabsList>

				<form onSubmit={handleSubmit} className="space-y-12">
					{/* Content */}
					<TabsContent value="content" className="space-y-6">
						<div className="space-y-4">
							<Label>Title</Label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Farming Revolution" />
						</div>

						<div className="space-y-4">
							<Label>Elevator Pitch</Label>
							<Textarea value={elevator} onChange={(e) => setElevator(e.target.value)} rows={3} />
						</div>

						<div className="space-y-4">
							<Label>Detailed Pitch</Label>
							<Textarea value={detailedPitchContent} onChange={(e) => setDetailedPitchContent(e.target.value)} rows={10} />
						</div>

						<div className="flex justify-end">
							<Button type="button" onClick={() => handleNext("content", "media")}>
								Next: Media
							</Button>
						</div>
					</TabsContent>

					{/* Media */}
					<TabsContent value="media" className="space-y-6">
						<div
							onClick={() => document.getElementById("media-input")?.click()}
							className="border border-dashed border-gray-300 rounded-md p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50"
						>
							<Plus className="w-6 h-6 text-primary mb-2" />
							<p className="font-medium">Upload Media Files</p>
							<p className="text-sm text-muted-foreground">Images or videos supported</p>
						</div>
						<Input id="media-input" type="file" className="hidden" multiple onChange={handleMediaChange} />

						{mediaPreviews.length > 0 && (
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
								{mediaPreviews.map((preview, i) => (
									<div key={i} className="relative group">
										{preview.type.startsWith("image/") ? (
											<img src={preview.url} className="w-full h-32 object-cover rounded-md" />
										) : (
											<video src={preview.url} className="w-full h-32 object-cover rounded-md bg-black" />
										)}
										<Button
											size="icon"
											type="button"
											onClick={() => removeMediaFile(i)}
											className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition"
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								))}
							</div>
						)}

						<div className="flex justify-between">
							<Button variant="outline" type="button" onClick={() => setActiveTab("content")}>
								Previous
							</Button>
							<Button type="button" onClick={() => handleNext("media", "financials")}>
								Next: Financials
							</Button>
						</div>
					</TabsContent>

					{/* Financials */}
					<TabsContent value="financials" className="space-y-6">
						<div className="grid gap-4">
							<div>
								<Label className="pb-3">Target Amount (£)</Label>
								<Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value) || "")} />
							</div>
							<div>
								<Label className="pb-3">Profit Share (%)</Label>
								<Input type="number" value={profitShare} onChange={(e) => setProfitShare(Number(e.target.value) || "")} />
							</div>
							<div>
								<Label className="pb-3">Start Date</Label>
								<Input value={format(investmentStartDate, "PPP")} readOnly />
							</div>
							<div>
								<Label className="pb-3">End Date</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" className="w-full justify-start">
											{endDate ? format(endDate, "PPP") : "Select date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="p-0 w-auto">
										<Calendar mode="single" selected={endDate} onSelect={setEndDate} fromDate={new Date()} />
									</PopoverContent>
								</Popover>
							</div>
						</div>

						<div className="flex justify-between">
							<Button variant="outline" type="button" onClick={() => setActiveTab("media")}>
								Previous
							</Button>
							<Button type="button" onClick={() => handleNext("financials", "tiers")}>
								Next: Tiers
							</Button>
						</div>
					</TabsContent>

					{/* Tiers */}
					<TabsContent value="tiers" className="space-y-8">
						{tiers.map((tier, i) => (
							<div key={i} className="border-b pb-6 space-y-4">
								<div className="flex justify-between items-center">
									<h4 className="font-semibold text-sm">Tier {i + 1}</h4>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeTierHandler(i)}
										disabled={tiers.length === 1}
										className="text-red-500"
									>
										<Trash className="w-4 h-4 mr-1" /> Remove
									</Button>
								</div>
								<div className="grid sm:grid-cols-4 gap-3">
									<div>
										<Label className="pb-3">Name</Label>
										<Input value={tier.name} onChange={(e) => handleTierChange(i, "name", e.target.value)}
											placeholder="e.g. Silver"
										/>
									</div>
									<div>
										<Label className="pb-3">Min (£)</Label>
										<Input
											type="number"
											value={tier.min_amount}
											onChange={(e) => handleTierChange(i, "min_amount", e.target.value)}
											placeholder="e.g. 1"
										/>
									</div>
									<div>
										<Label className="pb-3">Max (£)</Label>
										<Input
											type="number"
											value={tier.max_amount}
											onChange={(e) => handleTierChange(i, "max_amount", e.target.value)}
											placeholder="e.g. 1000"
										/>
									</div>
									<div>
										<Label className="pb-3">Multiplier</Label>
										<Input
											type="number"
											value={tier.multiplier}
											onChange={(e) => handleTierChange(i, "multiplier", e.target.value)}
											placeholder="e.g. 1.5"
										/>
									</div>
								</div>
							</div>
						))}

						<Button variant="outline" type="button" onClick={addTier} className="w-full">
							<Plus className="w-4 h-4 mr-2" /> Add Tier
						</Button>

						<div className="flex justify-between">
							<Button variant="outline" type="button" onClick={() => setActiveTab("financials")}>
								Previous
							</Button>
							<Button type="button" onClick={() => handleNext("tiers", "overview")}>
								Next: Overview
							</Button>
						</div>
					</TabsContent>

					{/* Overview */}
					<TabsContent value="overview" className="space-y-8">
						<div className="space-y-6">
							<h3 className="text-xl font-semibold">Review Your Pitch</h3>
							<p className="text-muted-foreground">
								Please review all your details before submitting your pitch.
							</p>

							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">Content</h4>
								<p><strong>Title:</strong> {title || "—"}</p>
								<p><strong>Elevator Pitch:</strong> {elevator || "—"}</p>
								<p><strong>Detailed Pitch:</strong> {detailedPitchContent || "—"}</p>
							</div>

							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">Media</h4>
								{mediaPreviews.length > 0 ? (
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
										{mediaPreviews.map((m, i) => (
											<div key={i}>
												{m.type.startsWith("image/") ? (
													<img src={m.url} alt="" className="w-full h-24 object-cover rounded-md" />
												) : (
													<video src={m.url} className="w-full h-24 object-cover rounded-md" />
												)}
												<p className="text-xs mt-1 truncate">{m.name}</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No media uploaded.</p>
								)}
							</div>

							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">Financials</h4>
								<p><strong>Target Amount:</strong> ${targetAmount || "—"}</p>
								<p><strong>Profit Share:</strong> {profitShare ? `${profitShare}%` : "—"}</p>
								<p><strong>Start Date:</strong> {format(investmentStartDate, "PPP")}</p>
								<p><strong>End Date:</strong> {endDate ? format(endDate, "PPP") : "—"}</p>
							</div>

							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">Tiers</h4>
								{tiers.length > 0 ? (
									<div className="space-y-3">
										{tiers.map((t, i) => (
											<div key={i} className="border p-3 rounded-md">
												<p><strong>Tier {i + 1}: </strong>{t.name || "—"}</p>
												<p>Min: £{t.min_amount || "—"} {t.max_amount ? `| Max: £${t.max_amount}` : ""}</p>
												<p>Multiplier: x{t.multiplier || "—"}</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No tiers defined.</p>
								)}
							</div>
						</div>

						{/* AI Analysis */}
						<div className="border rounded-lg p-6 space-y-4">
							<div className="flex justify-between items-center">
								<h4 className="font-medium text-lg">AI Analysis</h4>
								<Button
									type="button"
									variant="secondary"
									onClick={handleAiAnalysis}
									disabled={aiLoading}
								>
									{aiLoading ? "Analysing..." : "Generate AI Analysis"}
								</Button>
							</div>

							{aiAnalysis ? (
								<p className="text-sm whitespace-pre-line">{aiAnalysis}</p>
							) : (
								<p className="text-sm text-muted-foreground">
									Click the button above to get AI feedback on your pitch.
								</p>
							)}
						</div>

						<div className="flex justify-between">
							<Button variant="outline" type="button" onClick={() => setActiveTab("tiers")}>
								Previous
							</Button>
							<Button className="bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={loading}>
								{loading ? "Submitting..." : "Submit Pitch"}
							</Button>
						</div>
					</TabsContent>
				</form>
			</Tabs>
		</div>
	);
}
