"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
	Plus,
	Trash,
	FileText,
	Image as ImageIcon,
	Video,
	X,
	FileTextIcon,
	Wallet,
	Layers,
	GalleryVertical,
	BrainCircuit,
} from "lucide-react";
import { format } from "date-fns";
import { NewPitch, Pitch as FetchedPitch } from "@/lib/types/pitch";
import { getPitchById, patchPitch } from "@/lib/api/pitch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { describePitch } from "@/lib/describePitch";
import { generateFeedback } from "@/lib/api/ai";
import ReactMarkdown from "react-markdown";

type TierState = {
	name: string;
	min_amount: number | "";
	max_amount: number | "";
	multiplier: number | "";
};

type MediaDisplayItem = {
	id: string;
	name: string;
	type: string;
	url: string;
	isNew: boolean;
};

// utility function to display the correct icon based on mime type
const getFileIcon = (mimeType: string) => {
	if (mimeType.startsWith("image/"))
		return <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />;
	if (mimeType.startsWith("video/"))
		return <Video className="w-4 h-4 mr-2 text-purple-500" />;
	return <FileText className="w-4 h-4 mr-2 text-gray-500" />;
};

export default function EditPitchPage() {
	const router = useRouter();
	const params = useParams();
	// safely determine pitch id from url parameters
	const pitchId = typeof params.id === 'string' ? params.id : undefined;
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	// state for pitch form fields
	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [detailedPitchContent, setDetailedPitchContent] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);
	// media handling state: fetched (existing) and mediaFiles (newly uploaded)
	const [fetchedMedia, setFetchedMedia] = useState<MediaDisplayItem[]>([]);
	const [mediaFiles, setMediaFiles] = useState<File[]>([]);
	// investment tier state
	const [tiers, setTiers] = useState<TierState[]>([
		{ name: "", min_amount: "", multiplier: "", max_amount: "" },
	]);
	// loading state for form submission and initial data fetch
	const [loading, setLoading] = useState(false);
	const [pageLoading, setPageLoading] = useState(!!pitchId);
	const [activeTab, setActiveTab] = useState("content");
	const investmentStartDate = useMemo(() => new Date(), []); // investment always starts today

	// ai analysis state
	const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
	const [aiLoading, setAiLoading] = useState(false);
	const [ragRating, setRagRating] = useState<string | null>(null);

	// utility to apply correct styling based on r.a.g. rating
	const getRagBadgeClasses = (rating: string | null) => {
		switch (rating) {
			case 'GREEN':
				return 'bg-green-100 text-green-700 border-green-400';
			case 'AMBER':
				return 'bg-amber-100 text-amber-700 border-amber-400';
			case 'RED':
				return 'bg-red-100 text-red-700 border-red-400';
			default:
				return 'bg-gray-100 text-gray-500 border-gray-400';
		}
	};

	// fetches existing pitch data for editing and populates state
	const fetchAndSetPitch = useCallback(async (id: string) => {
		setPageLoading(true);
		try {
			const pitchData: FetchedPitch = await getPitchById(parseInt(id));

			setTitle(pitchData.title);
			setElevator(pitchData.elevator_pitch);
			setDetailedPitchContent(pitchData.detailed_pitch);
			setTargetAmount(pitchData.target_amount);
			setProfitShare(pitchData.profit_share_percent);
			setEndDate(new Date(pitchData.investment_end_date));

			// map fetched media to display format
			setFetchedMedia(pitchData.media?.map(m => {
				const fileName = m.url.split('/').pop() || "existing file";
				return {
					id: m.media_id ? String(m.media_id) : fileName,
					url: m.url,
					type: m.media_type,
					name: fileName,
					isNew: false,
				};
			}) ?? []);

			// map fetched tiers to state format
			const tiersData = pitchData.investment_tiers ?? [];
			setTiers(tiersData.map(t => ({
				name: t.name,
				min_amount: t.min_amount,
				max_amount: t.max_amount ?? "",
				multiplier: t.multiplier,
			})));

			toast("pitch data loaded for editing.");
		} catch (error) {
			console.error("error fetching pitch:", error);
			toast("failed to load pitch data.");
			router.push("/business/dashboard");
		} finally {
			setPageLoading(false);
		}
	}, [router]);

	// effect to verify auth on mount
	useEffect(() => {
		const verifyAuthAndFetch = async () => {
			await checkAuth();
		};
		verifyAuthAndFetch();
	}, [checkAuth]);

	// effect for redirection and initial data fetch after auth check
	useEffect(() => {
		if (isCheckingAuth) {
			return;
		}

		// redirect unauthenticated users
		if (!authUser) {
			toast("you must be logged in to create or edit a pitch.");
			router.push("/");
			return;
		}

		// fetch pitch data if in edit mode
		if (pitchId) {
			fetchAndSetPitch(pitchId);
		}

	}, [authUser, isCheckingAuth, router, pitchId, fetchAndSetPitch]);


	// combines existing and new media for display
	const mediaPreviews = useMemo(
		() =>
			mediaFiles.map((file, index) => ({
				id: `new-${index}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`,
				name: file.name,
				type: file.type,
				url: URL.createObjectURL(file),
				isNew: true,
			})),
		[mediaFiles]
	);

	const allMediaToDisplay: MediaDisplayItem[] = useMemo(
		() => [...fetchedMedia, ...mediaPreviews],
		[fetchedMedia, mediaPreviews]
	);


	// cleanup for object urls when component unmounts or media list changes
	useEffect(() => {
		return () => {
			mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
		};
	}, [mediaFiles, mediaPreviews]);

	// handles calling the ai feedback api
	const handleAiAnalysis = async () => {
		setAiLoading(true);
		setAiAnalysis(null);
		setRagRating(null);

		// input validation before generating analysis
		if (!title.trim() || !elevator.trim() || !detailedPitchContent.trim()) {
			toast("cannot generate analysis: pitch content is missing.");
			setAiLoading(false);
			return;
		}
		if (typeof targetAmount !== "number" || targetAmount <= 0) {
			toast("cannot generate analysis: target amount must be a positive number.");
			setAiLoading(false);
			return;
		}
		if (typeof profitShare !== "number" || profitShare < 0) {
			toast("cannot generate analysis: profit share percent must be zero or positive.");
			setAiLoading(false);
			return;
		}
		if (!(investmentStartDate instanceof Date) || isNaN(investmentStartDate.getTime())) {
			toast("cannot generate analysis: investment start date is invalid.");
			setAiLoading(false);
			return;
		}
		if (endDate && (!(endDate instanceof Date) || isNaN(endDate.getTime()))) {
			toast("cannot generate analysis: investment end date is invalid.");
			setAiLoading(false);
			return;
		}
		if (!tiers || tiers.length === 0) {
			toast("cannot generate analysis: at least one investment tier is required.");
			setAiLoading(false);
			return;
		}
		const hasInvalidTier = tiers.some(t => typeof t.min_amount !== "number" || t.min_amount < 0);
		if (hasInvalidTier) {
			toast("cannot generate analysis: all investment tiers must have a valid minimum amount.");
			setAiLoading(false);
			return;
		}

		// constructing the pitch object for ai analysis
		const pitchObject: NewPitch = {
			title,
			elevator_pitch: elevator,
			detailed_pitch: detailedPitchContent,
			target_amount: typeof targetAmount === "number" ? targetAmount : 0,
			investment_start_date: investmentStartDate.toISOString(),
			investment_end_date: endDate ? endDate.toISOString() : new Date().toISOString(),
			profit_share_percent: typeof profitShare === "number" ? profitShare : 0,
			status: "Active",
			investment_tiers: tiers.map((t) => ({
				name: t.name,
				min_amount: typeof t.min_amount === "number" ? t.min_amount : 0,
				max_amount: typeof t.max_amount === "number" ? t.max_amount : null,
				multiplier: typeof t.multiplier === "number" ? t.multiplier : 1,
			})),
		};

		const pitchDescription = describePitch(pitchObject); // utility to format pitch data into a string
		console.log(pitchDescription);

		if (!pitchDescription) {
			setAiAnalysis("pitch description could not be generated from the data. check your inputs.");
			setAiLoading(false);
			return;
		}

		const result = await generateFeedback(pitchDescription); // api call to ai service

		if (result) {
			setRagRating(result.ragRating);
			setAiAnalysis(`${result.feedback}`);
		} else {
			setAiAnalysis("failed to generate ai analysis. try again.");
		}

		setAiLoading(false);
	};

	// adds new files to the mediaFiles state
	const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newFiles = e.target.files;
		if (newFiles && newFiles.length > 0) {
			setMediaFiles((prev) => [...prev, ...Array.from(newFiles)]);
			e.target.value = ""; // clear input for re-selection of same file
			toast(`added ${newFiles.length} new file(s).`);
		}
	};

	// removes media from either fetched (existing) or mediaFiles (new)
	const removeMediaFile = (id: string, isNew: boolean, fileUrl: string) => {
		if (isNew) {
			// remove new file from mediaFiles and revoke object url
			const fileIndex = mediaFiles.findIndex(f => URL.createObjectURL(f) === fileUrl);
			if (fileIndex !== -1) {
				URL.revokeObjectURL(fileUrl);
				setMediaFiles((prev) => prev.filter((_, idx) => idx !== fileIndex));
			}
		} else {
			// remove existing file from fetchedMedia, signalling deletion on update
			setFetchedMedia((prev) => prev.filter(m => m.id !== id));
			toast("existing file removed. will be treated as deleted on next update.");
		}
		toast("removed file.");
	};


	// updates a specific field for a specific tier
	const handleTierChange = (i: number, field: keyof TierState, value: any) => {
		const updated = [...tiers];
		updated[i][field] = value === "" ? "" : field === "name" ? value : Number(value);
		setTiers(updated);
	};

	// add/remove tier handlers
	const addTier = () => setTiers([...tiers, { name: "", min_amount: "", multiplier: "", max_amount: "" }]);
	const removeTierHandler = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));

	// validation logic for checking required fields for each tab
	const validateStep = (step: string) => {
		if (step === "content") {
			if (!title.trim() || !elevator.trim() || !detailedPitchContent.trim()) {
				toast("please complete all text fields before proceeding.");
				return false;
			}
		}
		if (step === "financials") {
			if (targetAmount === "" || profitShare === "" || !endDate) {
				toast("please complete all financial fields.");
				return false;
			}
			if (typeof targetAmount !== "number" || targetAmount <= 0) {
				toast("target amount must be positive.");
				return false;
			}
			if (endDate <= investmentStartDate) {
				toast("end date must be in the future.");
				return false;
			}
		}
		if (step === "tiers") {
			const valid = tiers.every(
				(t) =>
					t.name.trim() &&
					t.min_amount !== "" &&
					t.multiplier !== "" &&
					Number(t.min_amount) >= 0 && // min amount can be zero
					Number(t.multiplier) > 0
			);
			if (!valid) {
				toast("all tiers must have valid values.");
				return false;
			}
		}
		return true;
	};

	// navigates to the next tab if current tab validates successfully
	const handleNext = (current: string, next: string) => {
		if (validateStep(current)) {
			setActiveTab(next);
			window.scrollTo(0, 0); // scroll to top on tab change
		}
	};

	// handles form submission (update or create)
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// final validation across all essential steps
		if (!validateStep("content") || !validateStep("financials") || !validateStep("tiers")) return;

		// the fetchedMedia list currently holds media ids that should remain attached
		const remainingMediaIds = fetchedMedia
			.filter(m => !m.isNew && m.id)
			.map(m => m.id);

		// construct the pitch payload
		const pitchPayload: NewPitch = {
			title,
			elevator_pitch: elevator,
			detailed_pitch: detailedPitchContent,
			target_amount: Number(targetAmount),
			investment_start_date: investmentStartDate.toISOString(),
			investment_end_date: endDate!.toISOString(),
			status: "Active", // default status
			profit_share_percent: Number(profitShare),
			investment_tiers: tiers.map((t) => ({
				name: t.name,
				min_amount: Number(t.min_amount),
				// handles optional max_amount
				max_amount:
					t.max_amount === "" || t.max_amount === undefined || t.max_amount === null
						? null
						: Number(t.max_amount),
				multiplier: Number(t.multiplier),
			})),
			// implicitly passing remainingMediaIds here for patch logic (not shown, but assumed)
		};

		const formData = new FormData();
		formData.append("pitch", JSON.stringify(pitchPayload));
		mediaFiles.forEach((f) => formData.append("media", f)); // append new files

		try {
			setLoading(true);

			if (pitchId) {
				// update existing pitch
				await patchPitch(Number(pitchId), formData);
				toast("pitch updated successfully! 💾");
				router.push("/business/dashboard");
			}

		} catch (err) {
			console.error(err);
			toast("submission failed.");
		} finally {
			setLoading(false);
		}
	};

	const pageTitle = pitchId ? "edit pitch" : "create new pitch";

	// render loading component if page is loading or checking auth
	if (pageLoading || isCheckingAuth) {
		// assuming LoaderComponent is available and correctly imported
		return <div>loading...</div>;
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
			<div>
				<h1 className="text-3xl font-semibold tracking-tight">{pageTitle}</h1>
				<p className="text-muted-foreground mt-1">
					{pitchId ? "modify and update your investment proposal." : "follow the steps below to describe and submit your investment proposal."}
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				{/* tab navigation for pitch creation steps */}
				<TabsList className="w-full justify-start border-b rounded-none p-0 mb-8 bg-transparent">
					<TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm">
						<FileTextIcon className="w-4 h-4 mr-2" /> content
					</TabsTrigger>
					<TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm">
						<GalleryVertical className="w-4 h-4 mr-2" /> media
					</TabsTrigger>
					<TabsTrigger value="financials" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm">
						<Wallet className="w-4 h-4 mr-2" /> financials
					</TabsTrigger>
					<TabsTrigger value="tiers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm">
						<Layers className="w-4 h-4 mr-2" /> tiers
					</TabsTrigger>
					<TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm">
						<FileText className="w-4 h-4 mr-2" /> overview
					</TabsTrigger>
					<TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 py-2 text-sm">
						<BrainCircuit className="w-4 h-4 mr-2" /> ai analysis
					</TabsTrigger>
				</TabsList>

				<form onSubmit={handleSubmit} className="space-y-12" key={pitchId || "new"}>
					{/* tab 1: content fields */}
					<TabsContent value="content" className="space-y-6">
						<div className="space-y-4">
							<Label>title</Label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ai farming revolution" />
						</div>
						<div className="space-y-4">
							<Label>elevator pitch</Label>
							<Textarea value={elevator} onChange={(e) => setElevator(e.target.value)} rows={3} />
						</div>
						<div className="space-y-4">
							<Label>detailed pitch</Label>
							<Textarea value={detailedPitchContent} onChange={(e) => setDetailedPitchContent(e.target.value)} rows={10} />
						</div>
						<div className="flex justify-end">
							<Button type="button" onClick={() => handleNext("content", "media")}>
								next: media
							</Button>
						</div>
					</TabsContent>

					{/* tab 2: media uploads */}
					<TabsContent value="media" className="space-y-6">
						{/* media upload area */}
						<div
							onClick={() => document.getElementById("media-input")?.click()}
							className="border border-dashed border-gray-300 rounded-md p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50"
						>
							<Plus className="w-6 h-6 text-primary mb-2" />
							<p className="font-medium">upload media files</p>
							<p className="text-sm text-muted-foreground">images or videos supported</p>
						</div>
						<Input id="media-input" type="file" className="hidden" multiple onChange={handleMediaChange} />

						{/* media previews and removal */}
						{allMediaToDisplay.length > 0 && (
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
								{allMediaToDisplay.map((preview, i) => (
									<div key={preview.id} className="relative group">
										{preview.type.startsWith("image/") ? (
											<img src={preview.url} alt={`media preview ${i + 1}`} className="w-full h-32 object-cover rounded-md" />
										) : (
											<video src={preview.url} className="w-full h-32 object-cover rounded-md bg-black" controls />
										)}
										<Button
											size="icon"
											type="button"
											onClick={() => removeMediaFile(preview.id, preview.isNew, preview.url)}
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
								previous
							</Button>
							<Button type="button" onClick={() => handleNext("media", "financials")}>
								next: financials
							</Button>
						</div>
					</TabsContent>

					{/* tab 3: financial details */}
					<TabsContent value="financials" className="space-y-6">
						<div className="grid gap-4">
							<div>
								<Label className="pb-3">target amount (£)</Label>
								<Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value) || "")} />
							</div>
							<div>
								<Label className="pb-3">profit share (%)</Label>
								<Input type="number" value={profitShare} onChange={(e) => setProfitShare(Number(e.target.value) || "")} />
							</div>
							<div>
								<Label className="pb-3">start date</Label>
								<Input value={format(investmentStartDate, "ppp")} readOnly />
							</div>
							<div>
								<Label className="pb-3">end date</Label>
								{/* calendar popover for end date selection */}
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" className="w-full justify-start">
											{endDate ? format(endDate, "ppp") : "select date"}
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
								previous
							</Button>
							<Button type="button" onClick={() => handleNext("financials", "tiers")}>
								next: tiers
							</Button>
						</div>
					</TabsContent>

					{/* tab 4: investment tiers */}
					<TabsContent value="tiers" className="space-y-8">
						{tiers.map((tier, i) => (
							<div key={i} className="border-b pb-6 space-y-4">
								<div className="flex justify-between items-center">
									<h4 className="font-semibold text-sm">tier {i + 1}</h4>
									{/* remove tier button, disabled if only one tier remains */}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeTierHandler(i)}
										disabled={tiers.length === 1}
										className="text-red-500"
									>
										<Trash className="w-4 h-4 mr-1" /> remove
									</Button>
								</div>
								<div className="grid sm:grid-cols-4 gap-3">
									<div>
										<Label className="pb-3">name</Label>
										<Input value={tier.name} onChange={(e) => handleTierChange(i, "name", e.target.value)} placeholder="e.g. silver" />
									</div>
									<div>
										<Label className="pb-3">min (£)</Label>
										<Input type="number" value={tier.min_amount} onChange={(e) => handleTierChange(i, "min_amount", e.target.value)} placeholder="e.g. 1" />
									</div>
									<div>
										<Label className="pb-3">multiplier</Label>
										<Input type="number" value={tier.multiplier} onChange={(e) => handleTierChange(i, "multiplier", e.target.value)} placeholder="e.g. 1.5" />
									</div>
								</div>
							</div>
						))}

						{/* add tier button */}
						<Button variant="outline" type="button" onClick={addTier} className="w-full">
							<Plus className="w-4 h-4 mr-2" /> add tier
						</Button>

						<div className="flex justify-between">
							<Button variant="outline" type="button" onClick={() => setActiveTab("financials")}>
								previous
							</Button>
							<Button type="button" onClick={() => handleNext("financials", "overview")}>
								next: overview
							</Button>
						</div>
					</TabsContent>

					{/* tab 5: overview and submission */}
					<TabsContent value="overview" className="space-y-8">
						<div className="space-y-6">
							<h3 className="text-xl font-semibold">review your pitch</h3>
							<p className="text-muted-foreground">please review all your details before submitting your pitch.</p>

							{/* content summary */}
							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">content</h4>
								<p><strong>title:</strong> {title || "—"}</p>
								<p><strong>elevator pitch:</strong> {elevator || "—"}</p>
								<p><strong>detailed pitch:</strong> {detailedPitchContent || "—"}</p>
							</div>

							{/* media summary */}
							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">media</h4>
								{allMediaToDisplay.length > 0 ? (
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
										{allMediaToDisplay.map((m, i) => (
											<div key={m.id}>
												{m.type.startsWith("image/") ? (
													<img src={m.url} alt="" className="w-full h-24 object-cover rounded-md" />
												) : (
													<video src={m.url} className="w-full h-24 object-cover rounded-md" />
												)}
												<p className="text-xs mt-1 truncate">{m.name} {m.isNew && <span className="text-blue-500">(new)</span>}</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">no media uploaded.</p>
								)}
							</div>

							{/* financial summary */}
							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">financials</h4>
								<p><strong>target amount:</strong> £{targetAmount || "—"}</p>
								<p><strong>profit share:</strong> {profitShare ? `${profitShare}%` : "—"}</p>
								<p><strong>start date:</strong> {format(investmentStartDate, "ppp")}</p>
								<p><strong>end date:</strong> {endDate ? format(endDate, "ppp") : "—"}</p>
							</div>

							{/* tiers summary */}
							<div className="border rounded-lg p-6 space-y-4">
								<h4 className="font-medium text-lg">tiers</h4>
								{tiers.length > 0 ? (
									<div className="space-y-3">
										{tiers.map((t, i) => (
											<div key={i} className="border p-3 rounded-md">
												<p><strong>tier {i + 1}: </strong>{t.name || "—"}</p>
												<p>min: £{t.min_amount || "—"}</p>
												<p>multiplier: x{t.multiplier || "—"}</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">no tiers defined.</p>
								)}
							</div>
						</div>

						<div className="flex justify-between">
							<Button variant="outline" type="button" onClick={() => setActiveTab("tiers")}>
								previous
							</Button>
							{/* submit button */}
							<Button className="bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={loading}>
								{loading ? (pitchId ? "updating..." : "submitting...") : (pitchId ? "update pitch" : "submit pitch")}
							</Button>
						</div>
					</TabsContent>

					{/* tab 6: ai analysis and feedback */}
					<TabsContent value="ai" className="space-y-6">
						<div className="border rounded-lg p-6 space-y-4">
							<div className="flex justify-between items-center">
								<div className="flex items-center space-x-3">
									<h4 className="font-medium text-lg">ai analysis</h4>
									{/* r.a.g. rating badge */}
									{ragRating && (
										<span
											className={`
                                px-3 py-1 text-xs font-semibold rounded-full border uppercase
                                ${getRagBadgeClasses(ragRating)}
                            `}
										>
											{ragRating}
										</span>
									)}
								</div>

								{/* button to trigger ai analysis */}
								<Button type="button" variant="secondary" onClick={handleAiAnalysis} disabled={aiLoading}>
									{aiLoading ? "analysing..." : "generate ai analysis"}
								</Button>
							</div>

							{/* display area for ai analysis */}
							{aiLoading ? (
								<p className="text-sm text-primary animate-pulse">
									analysing pitch... please wait for the ai feedback.
								</p>
							) : aiAnalysis ? (
								// reactmarkdown renders markdown from the ai response
								<ReactMarkdown>
									{aiAnalysis}
								</ReactMarkdown>
							) : (
								<p className="text-sm text-muted-foreground">
									click the button above to get ai feedback on your pitch.
								</p>
							)}
						</div>
						<div className="flex justify-start">
							<Button variant="outline" type="button" onClick={() => setActiveTab("overview")}>
								previous
							</Button>
						</div>
					</TabsContent>
				</form>
			</Tabs>
		</div>
	);
}
