"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/authStore";
import * as Button from "@/components/Button";
import { getWalletBalance,addFundsToWallet, withdrawFundsFromWallet } from "@/lib/api/wallet";
import { getBankDetails } from "@/lib/api/bank";

export default function WithdrawPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const router = useRouter();

	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [walletBalance, setBalance] = useState<number | null>(null);
	const [bankDetails, setBankDetails] = useState<number | null>(null);

	//like in lickstarter
	const FUNDING_GOAL = 10000;


	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/")
		}
	}, [authUser, router])

	const loadWalletBalance = async () => {
		try {
			const data = await getWalletBalance();
			const bank = await getBankDetails();
			setBalance(data.dashboard_balance || 0);
			setBankDetails(bank.balance || 0);
		}
		catch (error) {
			toast.error("Failed to load your balance");
		}
	};
	useEffect(() => {
		loadWalletBalance();
	}, []);

	//Bank to balance
	const handleDeposit = async () => {
		const numAmount = Number(amount);

		if (!numAmount || numAmount <= 0) return toast.error("Enter a valid amount");
		if (numAmount > (bankDetails ?? 0)) return toast.error("Insufficient bank balance");

		setLoading(true);
		try{
			const data = await addFundsToWallet(numAmount);
			setBalance(data.dashboard_balance);
			await loadWalletBalance();
			toast.success(`Successfully deposited £${numAmount}`);
			setAmount("");
		} catch {
			toast.error("Deposit failed");
		} finally {
			setLoading(false);
		}
	};

	//From balance to bank
	const handleWithdraw = async () => {
		const numAmount = Number(amount);

		if (!numAmount || numAmount <= 0) {
			toast.error("Enter a valid amount");
			return;
		}

		if (numAmount > (walletBalance ?? 0)){
			toast.error("Insufficient balance");
			return;
		}

		setLoading(true);
		try{
			const data = await withdrawFundsFromWallet(numAmount);
			setBalance(data.dashboard_balance);
			await loadWalletBalance();
			toast.success(`Successfully withdrew £${numAmount}`);
			setAmount("");
		} catch {
			toast.error("Withdraw failed");
		} finally {
			setLoading(false);
		}
	};
	const progressPercent = walletBalance ? Math.min((walletBalance / FUNDING_GOAL) * 100, 100) : 0;

	return (
		 <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white shadow-sm rounded-2xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Profile Balance
        </h1>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-gray-200 p-5 bg-[#F8F9FA] hover:bg-gray-50 transition">
            <p className="text-gray-600 font-medium">Wallet Balance</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {walletBalance !== null ? `£${walletBalance.toLocaleString()}` : "Loading..."}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Available funds for investment
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 bg-[#F8F9FA] hover:bg-gray-50 transition">
            <p className="text-gray-600 font-medium">Bank Balance</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {bankDetails !== null ? `£${bankDetails.toLocaleString()}` : "Loading..."}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Connected account funds
            </p>
          </div>
        </div>
		<div className="mb-8">
			<div className ="flex justify-between text-sm text-grey-600 mb-1">
				<span>Funding goal</span>
				<span>£{walletBalance?.toLocaleString() || 0} / £{FUNDING_GOAL.toLocaleString()}
				</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-3">
				<div className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
					style={{ width: `${progressPercent}%` }}/>
				</div>
			</div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (£)"
            className="input input-bordered w-full sm:w-2/3 rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex gap-2 sm:w-1/3">
            <button
              onClick={handleDeposit}
              disabled={loading}
              className={`flex-1 py-2 rounded-xl text-white font-semibold transition ${
                loading
                  ? "opacity-60 cursor-not-allowed bg-emerald-400"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}>
              Deposit
            </button>

            <button
              onClick={handleWithdraw}
              disabled={loading}
              className={`flex-1 py-2 rounded-xl text-white font-semibold transition ${
                loading
                  ? "opacity-60 cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}>
              Withdraw
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center mt-6">
          Use profile balance to support new projects.
        </p>
      </div>
    </div>
  );
}



