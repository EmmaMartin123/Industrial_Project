"use client";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash, FileText, Image as ImageIcon, Video, X, Calendar as CalendarIcon, DollarSign, Percent, FileTextIcon, Wallet, Layers, GalleryVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NewPitch } from "@/lib/types/pitch";
import { postPitch } from "@/lib/api/pitch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TierState = {
	name: string;
	min_amount: number | "";
	max_amount?: number | "" | null | undefined;
	multiplier: number | "";
};

// helper function to determine the icon for a generic file type
const getFileIcon = (mimeType: string) => {
	if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />;
	if (mimeType.startsWith('video/')) return <Video className="w-4 h-4 mr-2 text-purple-500" />;
	return <FileText className="w-4 h-4 mr-2 text-gray-500" />;
};

export default function NewPitchPage() {
	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [detailedPitchContent, setDetailedPitchContent] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	const investmentStartDate = new Date();
	const [mediaFiles, setMediaFiles] = useState<File[]>([]);
	const [tiers, setTiers] = useState<TierState[]>([
		{ name: "", min_amount: "", multiplier: "", max_amount: "" },
	]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("content");

	const mediaPreviews = useMemo(() => {
		return mediaFiles.map(file => ({
			name: file.name,
			type: file.type,
			url: URL.createObjectURL(file),
		}));
	}, [mediaFiles]);

	// cleanup hook basically just revokes object urls on state change or unmount to prevent memory leaks
	useEffect(() => {
		// okay so this has to run when the component unmounts or when the dependencies change
		return () => {
			// revoke all urls from the previous mediapreviews state
			mediaPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
		};
	}, [mediaFiles]); // depend only on mediafiles to correctly track file array changes


	// handlers

	const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newFiles = e.target.files;

		if (newFiles && newFiles.length > 0) {
			// use functional update to correctly append new files to the state
			setMediaFiles((prevFiles) => [
				...prevFiles,
				...Array.from(newFiles)
			]);

			// clear the input value instantly HOURS BRO HOURS TO FIGURE THIS OUT but yeah that forces the browser to re fire the change event next time
			e.target.value = '';

			toast.success(`Added ${newFiles.length} new file(s).`);
		}
	};

	const removeMediaFile = (fileIndex: number) => {
		if (mediaPreviews[fileIndex]?.url) {
			URL.revokeObjectURL(mediaPreviews[fileIndex].url);
		}
		setMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== fileIndex));
		toast.success(`Removed file.`);
	};

	const handleTierChange = (index: number, field: keyof TierState, value: string | number) => {
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

	const removeTierHandler = (index: number) => {
		const newTiers = tiers.filter((_, i) => i !== index);
		setTiers(newTiers);
	};

	// validation / navigation logic
	const validateStep = (step: string): boolean => {
		if (step === "content") {
			if (!title.trim() || !elevator.trim() || !detailedPitchContent.trim()) {
				toast.error("Please complete the **Title**, **Elevator Pitch**, and **Detailed Pitch**.");
				return false;
			}
		} else if (step === "media") {
			if (mediaFiles.length === 0) {
				toast.success("Tip: Adding media greatly improves your pitch visibility!");
			}
		}
		else if (step === "financials") {
			// check for empty string / undefined / null for required fields
			if (targetAmount === "" || profitShare === "" || !endDate) {
				toast.error("Please provide valid numbers and select an **End Date**.");
				return false;
			}
			// check for valid numeric valuesv
			if (typeof targetAmount !== 'number' || typeof profitShare !== 'number' || targetAmount <= 0 || profitShare < 0) {
				toast.error("Target Amount and Profit Share must be positive numbers.");
				return false;
			}
			if (endDate! <= investmentStartDate) {
				toast.error("The End Date must be after today's Start Date.");
				return false;
			}
		} else if (step === "tiers") {
			const allTiersValid = tiers.every(
				(t) => t.name.trim() && t.min_amount !== "" && t.multiplier !== ""
			);
			if (!allTiersValid) {
				toast.error("Please ensure all tiers have a **Name**, **Min Amount**, and **Multiplier**.");
				return false;
			}
			const numericTiersValid = tiers.every(
				(t) => Number(t.min_amount) > 0 && Number(t.multiplier) > 0 && (t.max_amount === "" || t.max_amount === null || Number(t.max_amount) > Number(t.min_amount))
			);
			if (!numericTiersValid) {
				toast.error("Tier amounts and multipliers must be positive, and Max Amount must be greater than Min Amount.");
				return false;
			}
		}
		return true;
	}

	const handleNext = (currentStep: string, nextStep: string) => {
		if (validateStep(currentStep)) {
			setActiveTab(nextStep);
			window.scrollTo(0, 0);
		}
	};


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateStep("content") || !validateStep("financials") || !validateStep("tiers")) {
			return;
		}

		const pitchPayload: NewPitch = {
			title,
			elevator_pitch: elevator,
			detailed_pitch: detailedPitchContent,
			target_amount: Number(targetAmount),
			investment_start_date: investmentStartDate.toISOString(),
			investment_end_date: endDate!.toISOString(),
			profit_share_percent: Number(profitShare),
			investment_tiers: tiers.map((t) => ({
				name: t.name || "Tier",
				min_amount: Number(t.min_amount),
				max_amount: t.max_amount === "" || t.max_amount === undefined || t.max_amount === null
					? null
					: Number(t.max_amount),
				multiplier: Number(t.multiplier),
			})),
		};

		const formData = new FormData();
		formData.append("pitch", JSON.stringify(pitchPayload));
		if (mediaFiles.length > 0) {
			mediaFiles.forEach((file) => {
				formData.append("media", file);
			});
		}

		try {
			setLoading(true);
			await postPitch(formData);
			toast.success("Pitch submitted successfully! 🚀");
			// redirect here
			// router.push('/dashboard'); 
		} catch (err: any) {
			console.error(err);
			toast.error("Failed to submit pitch. Check console for details.");
		} finally {
			setLoading(false);
		}
	};


	return (
		<div className="flex justify-center p-8 bg-gray-50 min-h-screen">
			<Card className="w-full max-w-4xl border-0 shadow-none">
				<CardHeader>
					<CardTitle className="text-4xl font-extrabold text-gray-900">Create New Pitch</CardTitle>
					<CardDescription className="text-lg">
						Follow the steps below to define your investment proposal.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* tabs component wrapper */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

						{/* tab navigation list 4 tabs */}
						<TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1">
							<TabsTrigger value="content" className="flex items-center space-x-1 text-xs sm:text-sm">
								<FileTextIcon className="w-4 h-4" />
								<span>1. Content</span>
							</TabsTrigger>
							<TabsTrigger value="media" className="flex items-center space-x-1 text-xs sm:text-sm">
								<GalleryVertical className="w-4 h-4" />
								<span>2. Media</span>
							</TabsTrigger>
							<TabsTrigger value="financials" className="flex items-center space-x-1 text-xs sm:text-sm">
								<Wallet className="w-4 h-4" />
								<span>3. Financials</span>
							</TabsTrigger>
							<TabsTrigger value="tiers" className="flex items-center space-x-1 text-xs sm:text-sm">
								<Layers className="w-4 h-4" />
								<span>4. Tiers</span>
							</TabsTrigger>
						</TabsList>

						<form onSubmit={handleSubmit}>

							{/* tab 1: content */}
							<TabsContent value="content" className="space-y-8">
								<h4 className="text-xl font-semibold">Pitch Information</h4>

								{/* title */}
								<div className="space-y-2">
									<Label htmlFor="title">Title</Label>
									<Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Revolutionary AI-Powered Farming" required />
								</div>

								{/* elevator pitch */}
								<div className="space-y-2">
									<Label htmlFor="elevator">Elevator Pitch (Short Summary)</Label>
									<Textarea id="elevator" value={elevator} onChange={(e) => setElevator(e.target.value)} placeholder="A short, catchy summary for quick interest." required rows={3} maxLength={250} />
								</div>

								{/* detailed pitch */}
								<div className="space-y-2">
									<Label htmlFor="detailed">Detailed Pitch Content</Label>
									<Textarea
										id="detailed"
										value={detailedPitchContent}
										onChange={(e) => setDetailedPitchContent(e.target.value)}
										placeholder="Provide the full, comprehensive description. Use Markdown (*bold*, # headings, - lists) for formatting."
										required
										rows={12}
										className="resize-y"
									/>
									<p className="text-sm text-muted-foreground">This field supports Markdown for rich formatting.</p>
								</div>

								{/* navigation button */}
								<div className="flex justify-end pt-4">
									<Button type="button" onClick={() => handleNext("content", "media")} className="bg-indigo-600 hover:bg-indigo-700">
										Next: Media & Visuals
									</Button>
								</div>
							</TabsContent>

							{/* tab 2: media & visuals */}
							<TabsContent value="media" className="space-y-8">
								<h4 className="text-xl font-semibold text-indigo-700">2. Media & Visuals</h4>

								{/* media uploader */}
								<Label htmlFor="media-files" className="cursor-pointer block">
									<div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg hover:border-indigo-500 hover:bg-gray-100 transition-colors">
										<Plus className="w-6 h-6 mb-2 text-indigo-500" />
										<span className="font-semibold text-lg text-gray-700">Click here to add more files</span>
										<p className="text-sm text-muted-foreground mt-1">You can select **multiple** images or videos at once.</p>
									</div>
								</Label>
								<Input
									id="media-files"
									type="file"
									// ENABLE MULTIPLE SELECTION like bro i cant believe how long i spent on this
									multiple
									accept="image/*,video/*"
									onChange={handleMediaChange}
									className="hidden"
								/>

								{/* TODO: display selected files with previews */}
								{mediaPreviews.length > 0 && (
									<div className="space-y-4 pt-2">
										<p className="text-lg font-semibold">Selected Files ({mediaPreviews.length}):</p>
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
											{mediaPreviews.map((preview, index) => (
												<Card key={index} className="p-2 relative group overflow-hidden">
													{preview.type.startsWith('image/') && (
														<img
															src={preview.url}
															alt={`Media Preview ${index}`}
															className="w-full h-24 object-cover rounded-md"
														/>
													)}
													{preview.type.startsWith('video/') && (
														<video
															src={preview.url}
															className="w-full h-24 object-cover rounded-md bg-black"
															muted
															playsInline
														>
															Your browser does not support the video tag.
														</video>
													)}
													{/* fallback for non-visual files */}
													{!preview.type.startsWith('image/') && !preview.type.startsWith('video/') && (
														<div className="w-full h-24 flex items-center justify-center text-gray-500 bg-gray-100 rounded-md">
															<FileText className="w-6 h-6" />
														</div>
													)}

													{/* file name overlay */}
													<p className="text-xs font-medium truncate mt-2 px-1">{preview.name}</p>

													{/* remove button overlay */}
													<Button
														type="button"
														size="icon"
														onClick={() => removeMediaFile(index)}
														className="absolute top-4 right-4 w-6 h-6 p-0 text-white bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
													>
														<X className="w-4 h-4" />
													</Button>
												</Card>
											))}
										</div>
									</div>
								)}

								{/* navigation buttons */}
								<div className="flex justify-between pt-4">
									<Button type="button" variant="outline" onClick={() => setActiveTab("content")}>
										Previous
									</Button>
									<Button type="button" onClick={() => handleNext("media", "financials")} className="bg-indigo-600 hover:bg-indigo-700">
										Next: Financial Goals
									</Button>
								</div>
							</TabsContent>

							{/* tab 3: financial goals */}
							<TabsContent value="financials" className="space-y-8">
								<h4 className="text-xl font-semibold text-teal-700">3. Set Funding Targets and Timeline</h4>

								{/* target amount */}
								<div className="space-y-2">
									<Label htmlFor="targetAmount">Target Amount</Label>
									<div className="flex items-center">
										<span className="text-gray-500 mr-2"><DollarSign className="w-5 h-5" /></span>
										<Input type="number" id="targetAmount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="100,000" required min={1} />
									</div>
								</div>

								{/* profit share */}
								<div className="space-y-2">
									<Label htmlFor="profitShare">Profit Share Percentage</Label>
									<div className="flex items-center">
										<span className="text-gray-500 mr-2"><Percent className="w-5 h-5" /></span>
										<Input type="number" id="profitShare" value={profitShare} onChange={(e) => setProfitShare(e.target.value === "" ? "" : Number(e.target.value))} placeholder="10" required min={0} max={100} />
									</div>
								</div>

								{/* investment start date (read-only) */}
								<div className="space-y-2">
									<Label htmlFor="startDate">Start Date</Label>
									<div className="flex items-center">
										<span className="text-gray-500 mr-2"><CalendarIcon className="w-5 h-5" /></span>
										<Input
											id="startDate"
											value={format(investmentStartDate, "PPP")}
											readOnly
											className="bg-gray-100 cursor-not-allowed"
										/>
									</div>
									<p className="text-xs text-muted-foreground ml-7">Automatically set to today.</p>
								</div>

								{/* end date */}
								{/* TODO: change this immediately it looks garbage */}
								<div className="space-y-2">
									<Label htmlFor="endDate">Investment End Date</Label>
									<div className="flex items-center">
										<span className="text-gray-500 mr-2"><CalendarIcon className="w-5 h-5" /></span>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={"outline"}
													className={cn(
														"w-full justify-start text-left font-normal",
														!endDate && "text-muted-foreground"
													)}
												>
													{endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={endDate}
													onSelect={setEndDate}
													initialFocus
													// ensure the end date is at least one day after today
													fromDate={new Date(investmentStartDate.getTime() + 24 * 60 * 60 * 1000)}
												/>
											</PopoverContent>
										</Popover>
									</div>
								</div>

								{/* navigation buttons */}
								<div className="flex justify-between pt-4">
									<Button type="button" variant="outline" onClick={() => setActiveTab("media")}>
										Previous
									</Button>
									<Button type="button" onClick={() => handleNext("financials", "tiers")} className="bg-teal-600 hover:bg-teal-700">
										Next: Investment Tiers
									</Button>
								</div>
							</TabsContent>

							{/* tab 4: investment tiers */}
							<TabsContent value="tiers" className="space-y-8">
								<h4 className="text-xl font-semibold text-blue-700">4. Define Investment Levels</h4>

								<div className="space-y-4">
									{tiers.map((tier, index) => (
										<Card key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50 shadow-sm">
											<div className="flex justify-between items-start mb-2">
												<p className="font-bold text-lg text-blue-800">Tier {index + 1}</p>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removeTierHandler(index)}
													disabled={tiers.length === 1}
													className="text-red-500 hover:text-red-700 p-1 h-auto"
												>
													<Trash className="w-4 h-4 mr-1" /> Remove
												</Button>
											</div>

											<div className="space-y-3">
												<div className="space-y-1">
													<Label htmlFor={`tier-name-${index}`}>Name</Label>
													<Input
														id={`tier-name-${index}`}
														value={tier.name}
														onChange={(e) => handleTierChange(index, "name", e.target.value)}
														placeholder="e.g., Early Bird Investor"
														required
													/>
												</div>

												<div className="grid grid-cols-3 gap-2">
													<div className="space-y-1 col-span-1">
														<Label htmlFor={`tier-min-${index}`}>Min ($)</Label>
														<Input
															type="number"
															id={`tier-min-${index}`}
															value={tier.min_amount}
															onChange={(e) => handleTierChange(index, "min_amount", e.target.value)}
															placeholder="Min"
															required
															min={1}
														/>
													</div>
													<div className="space-y-1 col-span-1">
														<Label htmlFor={`tier-max-${index}`}>Max ($) (Opt)</Label>
														<Input
															type="number"
															id={`tier-max-${index}`}
															value={tier.max_amount === null ? "" : tier.max_amount}
															onChange={(e) => handleTierChange(index, "max_amount", e.target.value)}
															placeholder="Max"
															min={tier.min_amount === "" ? 1 : Number(tier.min_amount) + 1}
														/>
													</div>
													<div className="space-y-1 col-span-1">
														<Label htmlFor={`tier-mult-${index}`}>Multiplier</Label>
														<Input
															type="number"
															id={`tier-mult-${index}`}
															value={tier.multiplier}
															onChange={(e) => handleTierChange(index, "multiplier", e.target.value)}
															placeholder="x"
															required
															min={1}
														/>
													</div>
												</div>
											</div>
										</Card>
									))}
								</div>

								<Button type="button" onClick={addTier} variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-100">
									<Plus className="w-4 h-4 mr-2" /> Add Investment Tier
								</Button>

								{/* navigation / submit buttons */}
								<div className="flex justify-between pt-4">
									<Button type="button" variant="outline" onClick={() => setActiveTab("financials")}>
										Previous
									</Button>
									<Button type="submit" className="h-10 text-base bg-blue-600 hover:bg-blue-700" disabled={loading}>
										{loading ? "Submitting Pitch..." : "Submit Final Pitch"}
									</Button>
								</div>
							</TabsContent>
						</form>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
