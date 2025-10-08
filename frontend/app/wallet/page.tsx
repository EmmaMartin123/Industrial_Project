"use client";

import { useState, useEffect } from "react";
import { getWalletBalance, addFundsToWallet,withdrawFundsFromWallet } from "@/lib/api/wallet";
import { useRouter } from "next/navigation";

export default function WalletPage(){
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getWalletBalance();
      setBalance(data.dashboard_balance || 0);
    })();
  }, []);

  const handleDeposit = async () => {
    if (amount <= 0) return alert("Enter a valid amount: ");
    setLoading(true);
    try {
      const data = await addFundsToWallet(amount);
      setBalance(data.dashboard_balance);
      alert(`Deposited £${amount}`);
    } catch {
      alert("Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (amount <= 0) return alert("Enter a valid amount: ");
    setLoading(true);
    try {
      const data = await withdrawFundsFromWallet(amount);
      setBalance(data.dashboard_balance);
      alert(`Withdrawn £${amount}`);
    } catch {
      alert("Withdraw failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Profile Balance: £{balance}</h1>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Amount (£)"
        className="border p-2 rounded w-40"
      />
      <div className="space-x-2">
        <button
          onClick={handleDeposit}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Deposit
        </button>
        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Withdraw
        </button>
      </div>
    </div>
  );

} 