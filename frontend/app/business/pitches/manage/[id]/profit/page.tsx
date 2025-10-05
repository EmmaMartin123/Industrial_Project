"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import LoaderComponent from "@/components/Loader";
import * as Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function DeclareProfitPage() {
	const router = useRouter();
	const { id } = useParams();

	const [userId, setUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [pitch, setPitch] = useState<any>(null);

	const [profitAmount, setProfitAmount] = useState("");
	const [notes, setNotes] = useState("");

	// Get user session
	useEffect(() => {
		const getSession = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				setUserId(session?.user?.id || null);
			} catch (error) {
				console.error("Auth Error:", error);
				toast.error("Failed to authenticate.");
			}
		};
		getSession();
	}, []);

	// Fetch the pitch details
	useEffect(() => {
		const fetchPitch = async () => {
			if (!id) return;
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from("pitches")
					.select("*")
					.eq("id", id)
					.single();

				if (error) throw error;
				setPitch(data);
			} catch (err: any) {
				console.error("Error fetching pitch:", err);
				toast.error("Could not load pitch details.");
			} finally {
				setLoading(false);
			}
		};

		fetchPitch();
	}, [id]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profitAmount) {
			toast.error("Please enter a profit amount.");
			return;
		}

		setSubmitting(true);
		try {
			// Example: Save profit declaration in a `profits` table
			const { error } = await supabase.from("profits").insert([
				{
					pitch_id: id,
					declared_by: userId,
					amount: profitAmount,
					notes,
				},
			]);

			if (error) throw error;

			toast.success("Profit declared successfully!");
			router.push("/business/manage-pitches");
		} catch (err: any) {
			console.error("Error declaring profit:", err);
			toast.error("Failed to declare profit.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return <LoaderComponent />;

	if (!pitch) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center text-center">
				<h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
					Pitch Not Found
				</h2>
				<p className="text-gray-500 dark:text-gray-400">
					The pitch you are trying to access does not exist.
				</p>
				<button
					className={`${Button.buttonClassName} mt-6`}
					onClick={() => router.push("/business/manage-pitches")}
				>
					Back to Manage Pitches
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-3xl mx-auto">
				<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
					<CardHeader>
						<CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
							Declare Profit
						</CardTitle>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							Declare a profit for your pitch:{" "}
							<span className="font-semibold text-gray-900 dark:text-white">
								{pitch.title}
							</span>
						</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6 mt-4">
							<div>
								<Label htmlFor="profitAmount">Profit Amount (£)</Label>
								<Input
									id="profitAmount"
									type="number"
									step="0.01"
									placeholder="Enter profit amount"
									value={profitAmount}
									onChange={(e) => setProfitAmount(e.target.value)}
									required
									className="mt-2"
								/>
							</div>

							<div>
								<Label htmlFor="notes">Notes (optional)</Label>
								<Textarea
									id="notes"
									placeholder="Add any remarks or context for this profit declaration"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className="mt-2"
								/>
							</div>

							<div className="flex justify-end gap-3 pt-4">
								<button
									type="button"
									className={`${Button.buttonOutlineClassName}`}
									onClick={() => router.push("/business/manage-pitches")}
								>
									Cancel
								</button>
								<button
									type="submit"
									className={`${Button.buttonClassName} bg-green-600 hover:bg-green-700 text-white`}
									disabled={submitting}
								>
									{submitting ? "Submitting..." : "Declare Profit"}
								</button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

