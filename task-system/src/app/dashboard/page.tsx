"use client";
import React, { useEffect, useState } from "react";
import TaskTable from "@/components/TaskTable";
import TaskForm from "@/components/TaskForm";
import CategoryStats from "@/components/CategoryStats";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [stats, setStats] = useState<Record<string, number>>({});
    const [filterDate, setFilterDate] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [userName, setUserName] = useState("User");

    const computeStats = (taskList: any[]) => {
        const newStats: Record<string, number> = {};
        const categories = ["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"];
        categories.forEach(c => newStats[c] = 0);

        taskList.forEach(t => {
            if (t.category) newStats[t.category] = (newStats[t.category] || 0) + 1;
        });
        setStats(newStats);
    };

    const fetchTasks = async () => {
        try {
            const query = new URLSearchParams();
            if (filterDate) query.append("date", filterDate);
            if (filterCategory) query.append("category", filterCategory);

            const res = await fetch(`/api/tasks?${query.toString()}`);
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            if (!res.ok) {
                const txt = await res.text();
                console.error("Failed to fetch tasks:", res.status, txt);
                setTasks([]);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setTasks(data);
                computeStats(data);
                // Extract user name from first task if available
                if (data.length > 0 && data[0].user?.name) {
                    setUserName(data[0].user.name);
                }
            } else {
                console.error("API returned non-array:", data);
                setTasks([]);
            }
        } catch (e) {
            console.error(e);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch user info to check role
        const checkUser = async () => {
            // We can check role by hitting an auth endpoint or decoding token if available. 
            // Since fetchTasks returns 401 if not logged in, we can rely on that or add a specific me endpoint.
            // Simpler: Fetch tasks, if 403 or we see Admin data, redirect.
            // Actually, middleware redirects to /dashboard. We need to move them to /admin.
            // Let's assume fetchTasks will work for now, but we need to know the role.
            // Let's hitting /api/analytics which has user info.
            try {
                const res = await fetch("/api/analytics");
                if (res.ok) {
                    const data = await res.json();
                    // Identify if current user is admin? 
                    // The API doesn't explicitly return "currentUserRole" easily without modification.
                    // BUT, let's just use the fact that we are in strict mode.
                    // Ideally we should have a /api/me endpoint.
                }
            } catch { }
        };
        fetchTasks();
    }, [filterDate, filterCategory]);

    const handleTaskSaved = () => {
        setShowModal(false);
        setEditingTask(null);
        fetchTasks();
    };

    const handleEdit = (task: any) => {
        setEditingTask(task);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure?")) {
            await fetch(`/api/tasks/${id}`, { method: "DELETE" });
            fetchTasks();
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login"); // Middleware redirects to login, but explicit push is nice
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 glass p-6 rounded-2xl">
                    <div>
                        <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">My Workspace</h1>
                        <p className="text-sm text-gray-400 mt-1">Welcome back, <span className="text-white font-medium">{userName}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <ThemeToggle />
                        <Link href="/calendar" className="px-5 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/50 rounded-lg transition backdrop-blur-sm font-semibold">
                            📅 Calendar
                        </Link>
                        <Link href="/analytics" className="px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/50 rounded-lg transition backdrop-blur-sm font-semibold">
                            Team Analytics
                        </Link>
                        <button
                            onClick={() => { setEditingTask(null); setShowModal(true); }}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-bold shadow-lg shadow-blue-500/25"
                        >
                            + New Task
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition backdrop-blur-sm font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {!loading && <CategoryStats stats={stats} title="Task Overview" />}

                {/* Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4">
                    <h2 className="text-xl font-bold text-gray-300">My Tasks</h2>

                    <div className="flex gap-3">
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400 mb-1 font-medium ml-1">Filter by Date</label>
                            <input
                                type="date"
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition w-[160px]"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400 mb-1 font-medium ml-1">Filter by Category</label>
                            <select
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition w-[160px]"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                <option value="Axios">Axios</option>
                                <option value="Whatsapp">Whatsapp</option>
                                <option value="Other Task">Other Task</option>
                                <option value="Releases">Releases</option>
                                <option value="Monitoring">Monitoring</option>
                            </select>
                        </div>
                        {(filterDate || filterCategory) && (
                            <button
                                onClick={() => { setFilterDate(""); setFilterCategory(""); }}
                                className="self-end px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition text-sm font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-white text-xl animate-pulse mt-12">Loading workspace...</div>
                ) : (
                    <TaskTable tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} />
                )}

                {showModal && (
                    <TaskForm
                        task={editingTask}
                        onClose={() => setShowModal(false)}
                        onSave={handleTaskSaved}
                    />
                )}
            </div>
        </div>
    );
}
