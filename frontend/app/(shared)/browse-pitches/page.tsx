"use client";

import { useEffect, useState, useMemo } from "react";
import { Eye, Search, Filter, X, Plus, Minus } from "lucide-react";
import { mockPitches } from "@/lib/mockPitches";
import { useRouter } from "next/navigation";


export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches] = useState(mockPitches);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("none");
    const [showFilters, setShowFilters] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState(new Set());
	
	//additional filters states
	const [minRaised, setMinRaised] = useState("");
    const [maxRaised, setMaxRaised] = useState("");
    const [minProfit, setMinProfit] = useState("");
	//extract unique statuses
	const statuses = useMemo(() => {
		const stats = new Set(pitches.map(p => p.status));
		return Array.from(stats).sort();
	}, [pitches]);

	//filter and sort pitches
	const filteredPitches = useMemo(() => {
		let filtered = pitches.filter(pitch => {
		  const matchesSearch = pitch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
							   pitch.elevator_pitch.toLowerCase().includes(searchTerm.toLowerCase());
		  const matchesStatus = statusFilter === "all" || pitch.status === statusFilter;
		  const matchesRaised =
		  (!minRaised || pitch.raised_amount >= Number(minRaised)) &&
		  (!maxRaised || pitch.raised_amount <= Number(maxRaised));
		  const matchesProfit = !minProfit || pitch.profit_share_percent >= Number(minProfit);
		  return matchesSearch && matchesStatus&& matchesRaised && matchesProfit;
		});
	
		//sort
		if (sortBy === "raised-high") {
		  filtered.sort((a, b) => b.raised_amount - a.raised_amount);
		} else if (sortBy === "raised-low") {
		  filtered.sort((a, b) => a.raised_amount - b.raised_amount);
		} else if (sortBy === "profit-high") {
		  filtered.sort((a, b) => b.profit_share_percent - a.profit_share_percent);
		} else if (sortBy === "profit-low") {
		  filtered.sort((a, b) => a.profit_share_percent - b.profit_share_percent);
		}
		return filtered;
	}, [pitches, searchTerm, statusFilter, sortBy]);

	const toggleCompareSelection = (pitchId: number) => {
		const newSelected = new Set(selectedForCompare);
		if (newSelected.has(pitchId)) {
		  newSelected.delete(pitchId);
		} else {
		  if (newSelected.size < 3) {
			newSelected.add(pitchId);
		  }
		}
		setSelectedForCompare(newSelected);
	  };

	  const clearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		setSortBy("none");
		setMinRaised("");
		setMaxRaised("");
		setMinProfit("");
	  };
	
	  const comparePitches = pitches.filter(p => selectedForCompare.has(p.pitch_id));

	  return (
		<div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-base-content">All Pitches</h1>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`btn px-4 py-2 rounded-lg font-medium transition-colors ${
              compareMode
                ? "btn-primary text-white"
                : "btn-outline btn-primary"
			}`}
          >
            {compareMode ? "Exit Compare" : "Compare Pitches"}
          </button>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search pitches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full bg-base-200 text-base-content"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            {/* sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select select-bordered w-full max-w-xs bg-base-200 text-base-content"
            >
              <option value="none">Sort by...</option>
              <option value="raised-high">Raised Amount (High to Low)</option>
              <option value="raised-low">Raised Amount (Low to High)</option>
              <option value="profit-high">Profit Share (High to Low)</option>
              <option value="profit-low">Profit Share (Low to High)</option>
            </select>

            {(searchTerm || statusFilter !== "all" || sortBy !== "none" || minRaised || maxRaised || minProfit) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* status filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered w-full max-w-xs bg-base-200 text-base-content"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Raised Amount (£)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minRaised}
                    onChange={(e) => setMinRaised(e.target.value)}
                    className="w-1/2 px-3 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxRaised}
                    onChange={(e) => setMaxRaised(e.target.value)}
                    className="w-1/2 px-3 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Min Profit Share (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={minProfit}
                  onChange={(e) => setMinProfit(e.target.value)}
                  className="px-3 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* results count */}
        <div className="mb-4 text-gray-600">
          Showing {filteredPitches.length} of {pitches.length} pitches
          {compareMode && selectedForCompare.size > 0 && (
            <span className="ml-4 text-blue-600 font-medium">
              {selectedForCompare.size} selected for comparison
            </span>
          )}
        </div>

        {/* grid */}
        {filteredPitches.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">No pitches found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPitches.map((pitch) => {
              const isSelected = selectedForCompare.has(pitch.pitch_id);
              const progress = (pitch.raised_amount / pitch.target_amount) * 100;

              return (
                <div
                  key={pitch.pitch_id}
                  className={`bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between relative ${
                    isSelected ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  {compareMode && (
                    <button
                      onClick={() => toggleCompareSelection(pitch.pitch_id)}
                      className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600 hover:border-base-300"
                      }`}
                      disabled={!isSelected && selectedForCompare.size >= 3}
                    >
                      {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  )}

                  <div>
                    <h2 className="text-xl font-semibold text-base-content mb-2">{pitch.title}</h2>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{pitch.elevator_pitch}</p>

                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-base-content">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-3">
                      <span>£{pitch.raised_amount.toLocaleString()}</span>
                      <span>£{pitch.target_amount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profit Share:</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {pitch.profit_share_percent}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button 
					onClick={() => router.push(`/business/pitches/view?id=${pitch.pitch_id}`)}
					className="flex items-center gap-2 px-4 py-2 border border-base-300 text-gray-700 rounded-lg hover:bg-base-200 transition-colors font-medium">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
