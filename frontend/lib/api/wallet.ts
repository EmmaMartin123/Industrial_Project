import axios from "@/lib/axios";

// Check current wallet balance
export const getWalletBalance = async () => {
    const res = await axios.get("/api/wallet");
    return res.data;
}
 
// Top-up wallet 
export const addFundsToWallet = async (amount: number) => {
    const res = await axios.patch("/api/wallet", { 
        action: "deposit",
        amount,
    });
    return res.data;
};

// Withdraw money from wallet to bank account
export const withdrawFundsFromWallet = async (amount: number) => {
   const res = await axios.patch("/api/wallet", { 
        action: "withdraw",
        amount,
   });
   return res.data;
}

