"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Registration failed");
                setLoading(false);
            }
        } catch (err) {
            setError("An error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
            <div className="bg-white dark:bg-zinc-800 p-8 rounded shadow-md w-full max-w-sm border dark:border-zinc-700">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-2 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Name</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2 dark:bg-zinc-700 dark:border-zinc-600 outline-none focus:ring-2 focus:ring-green-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded p-2 dark:bg-zinc-700 dark:border-zinc-600 outline-none focus:ring-2 focus:ring-green-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded p-2 dark:bg-zinc-700 dark:border-zinc-600 outline-none focus:ring-2 focus:ring-green-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white rounded p-2 hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Register"}
                    </button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}
