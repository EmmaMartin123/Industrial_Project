import axios from "@/lib/axios";

export const getBankDetails = async () => {
    const res = await axios.get("/api/bank");
    return res.data;
};