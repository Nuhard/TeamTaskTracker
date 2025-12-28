"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Login failed");
                setLoading(false);
            }
        } catch (err) {
            setError("An error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-white/10 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Welcome Back</h2>
                    {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center backdrop-blur-sm">{error}</div>}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-300">Email Address</label>
                            <input
                                type="email"
                                className="w-full rounded-lg p-3 transition focus:ring-2 focus:ring-blue-500/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                            <input
                                type="password"
                                className="w-full rounded-lg p-3 transition focus:ring-2 focus:ring-blue-500/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                        >
                            {loading ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>
                    <p className="mt-6 text-sm text-center text-gray-500">
                    </p>
                </div>
            </div>
        </div>
    );
}
