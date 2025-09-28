"use client";

import { useState } from "react";
import Button from "@/components/Button";
import { Plus, Trash } from "lucide-react";
import toast from "react-hot-toast";

export default function NewPitchPage() {
  const [title, setTitle] = useState("");
  const [elevator, setElevator] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [profitShare, setProfitShare] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tiers, setTiers] = useState([
    { name: "", min: "", multiplier: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddTier = () => {
    setTiers([...tiers, { name: "", min: "", multiplier: "" }]);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    setTiers(newTiers);
  };

  const handleTierChange = (index: number, field: string, value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field as keyof typeof newTiers[0]] = value;
    setTiers(newTiers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !elevator || !description || !targetAmount || !profitShare || !endDate) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const payload = {
      title,
      elevator_pitch: elevator,
      detailed_pitch: description,
      target_amount: Number(targetAmount),
      investment_start_date: new Date().toISOString(),
      investment_end_date: new Date(endDate).toISOString(),
      profit_share_percent: Number(profitShare),
      investment_tiers: tiers.map((tier) => ({
        name: tier.name,
        min_amount: Number(tier.min),
        multiplier: Number(tier.multiplier),
      })),
    };

    try {
      setLoading(true);
      const res = await fetch("http://90.194.170.67:25560/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit pitch");

      toast.success("Pitch submitted successfully!");
      setTitle("");
      setElevator("");
      setDescription("");
      setTargetAmount("");
      setProfitShare("");
      setEndDate("");
      setTiers([{ name: "", min: "", multiplier: "" }]);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Pitch</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="label">Product Title</label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Elevator Pitch */}
        <div>
          <label className="label">Elevator Pitch</label>
          <textarea
            className="textarea textarea-bordered w-full"
            value={elevator}
            onChange={(e) => setElevator(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Detailed Pitch</label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Target Investment (£)</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Investor Profit Share (%)</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={profitShare}
              onChange={(e) => setProfitShare(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Investment End Date</label>
          <input
            type="date"
            className="input input-bordered w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Investment Tiers</h2>
          {tiers.map((tier, index) => (
            <div key={index} className="grid md:grid-cols-4 gap-2 items-end">
              <input
                type="text"
                placeholder="Tier Name"
                className="input input-bordered"
                value={tier.name}
                onChange={(e) => handleTierChange(index, "name", e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Min £"
                className="input input-bordered"
                value={tier.min}
                onChange={(e) => handleTierChange(index, "min", e.target.value)}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Multiplier"
                className="input input-bordered"
                value={tier.multiplier}
                onChange={(e) => handleTierChange(index, "multiplier", e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-error"
                onClick={() => handleRemoveTier(index)}
              >
                <Trash />
              </button>
            </div>
          ))}

          <Button type="button" onClick={handleAddTier} className="mt-2">
            <Plus /> Add Tier
          </Button>
        </div>

        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Submitting..." : "Submit Pitch"}
        </Button>
      </form>
    </div>
  );
}
