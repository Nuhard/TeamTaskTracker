"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                // Check if user is actually admin
                if (data.user.role !== 'ADMIN') {
                    console.log("Role mismatch:", data.user.role);
                    setError(`Access Denied: You are not an Administrator. (Role: ${data.user.role})`);
                    // Optionally logout immediately
                    await fetch("/api/auth/logout", { method: "POST" });
                } else {
                    router.push("/admin");
                }
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
            <div className="w-full max-w-md p-8 bg-zinc-800 rounded-lg shadow-2xl border border-zinc-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-red-500 mb-2">RESTRICTED ACCESS</h1>
                    <p className="text-gray-400">Admin Control Center</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                            placeholder="admin@company.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3 rounded transition shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Access Control Center"}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>Provide credentials to proceed.</p>
                    <p>Unauthorized access is prohibited.</p>
                </div>
            </div>
        </div>
    );
}
