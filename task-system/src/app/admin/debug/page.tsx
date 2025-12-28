"use client";
import React, { useEffect, useState } from "react";

export default function DebugStats() {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [rawText, setRawText] = useState<string>("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                setRawText(await res.clone().text());

                if (!res.ok) {
                    setError(`Error: ${res.status} ${res.statusText}`);
                    return;
                }
                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError("Fetch Error: " + err.message);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8 bg-black text-green-400 font-mono text-sm min-h-screen">
            <h1 className="text-xl font-bold text-white mb-4">API Debug Console</h1>

            <div className="mb-4">
                <h2 className="text-white border-b border-gray-700 mb-2">Endpoint: /api/admin/stats</h2>
                {error && <div className="text-red-500 font-bold mb-4">{error}</div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-white mb-2">Parsed JSON Data:</h3>
                    <pre className="bg-gray-900 p-4 rounded overflow-auto h-[500px] border border-gray-700">
                        {stats ? JSON.stringify(stats, null, 2) : "Loading or Error..."}
                    </pre>
                </div>
                <div>
                    <h3 className="text-white mb-2">Raw Response Text:</h3>
                    <pre className="bg-gray-900 p-4 rounded overflow-auto h-[500px] border border-gray-700 whitespace-pre-wrap">
                        {rawText || "Waiting for response..."}
                    </pre>
                </div>
            </div>
        </div>
    );
}
