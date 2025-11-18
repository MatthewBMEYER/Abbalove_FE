// hooks/useTags.js
import { useState, useEffect } from "react";
import api from "../api";

export const useTags = () => {
    const [availableTags, setAvailableTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTags = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/videos/tags/all");
            if (res.data.success) {
                setAvailableTags(res.data.data);
            }
        } catch (err) {
            console.error("Fetch tags error:", err);
            setError(err.response?.data?.message || "Failed to fetch tags");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    return {
        availableTags,
        loading,
        error,
        refetch: fetchTags
    };
};