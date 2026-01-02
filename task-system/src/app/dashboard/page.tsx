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
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [userName, setUserName] = useState("User");
    const [user, setUser] = useState<any>(null);
    const [showStats, setShowStats] = useState(true);

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
            if (debouncedSearch) query.append("search", debouncedSearch);

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
            } else {
                setTasks([]);
            }
        } catch (e) {
            console.error(e);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                if (data.role === 'ADMIN') {
                    router.push('/admin');
                    return;
                }
                setUser(data);
                setUserName(data.name || "User");
            }
        } catch (e) {
            console.error("Profile Fetch Error:", e);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchTasks();
    }, [filterDate, filterCategory, debouncedSearch]);

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
        router.push("/login");
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-6 glass p-4 md:p-6 rounded-2xl gap-4 border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">My Workspace</h1>
                            <div className="flex flex-col">
                                <p className="text-xs md:text-sm text-gray-400 mt-1">Welcome back, <span className="text-white font-medium">{userName}</span></p>
                                {user?.email && (
                                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter bg-white/5 w-fit px-2 py-0.5 rounded border border-white/5 mt-1">{user.email}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={`ml-4 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${showStats ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                            title={showStats ? "Hide Statistics" : "Show Statistics"}
                        >
                            {showStats ? '📊' : '📈'}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4">
                        <ThemeToggle />
                        <Link href="/calendar" className="flex-1 lg:flex-initial px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 rounded-lg transition backdrop-blur-sm font-semibold text-sm text-center">
                            📅 Calendar
                        </Link>
                        <Link href="/analytics" className="flex-1 lg:flex-initial px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition backdrop-blur-sm font-semibold text-sm text-center">
                            Team Analytics
                        </Link>
                        <button
                            onClick={() => { setEditingTask(null); setShowModal(true); }}
                            className="w-full lg:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-bold shadow-lg shadow-blue-500/25 order-first lg:order-none"
                        >
                            + New Task
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition backdrop-blur-sm font-semibold text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {!loading && showStats && <CategoryStats stats={stats} title="Overview" />}

                {/* Consolidated Filters */}
                <div className="mb-6 p-2 md:p-3 glass rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        {/* Search Bar */}
                        <div className="w-full md:w-[140px] order-last md:order-first">
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition text-xs">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-1 pl-9 pr-4 text-[10px] font-medium text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all shadow-inner placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                        {/* Category Pills Group */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-[280px] lg:min-w-0 pr-4 lg:border-r border-white/10">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest shrink-0">Filter:</span>
                            <button
                                onClick={() => setFilterCategory("")}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all duration-300 border ${!filterCategory
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                All
                            </button>
                            {["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all duration-300 border ${filterCategory === cat
                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Date Group */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest shrink-0">Date:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${filterDate === new Date().toISOString().split('T')[0]
                                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setFilterDate(new Date(Date.now() - 86400000).toISOString().split('T')[0])}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${filterDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    Yesterday
                                </button>
                            </div>
                            <div className="relative group">
                                <input
                                    type="date"
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-purple-500/50 transition w-[120px] cursor-pointer"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>
                            {(filterDate || filterCategory || searchTerm) && (
                                <button
                                    onClick={() => { setFilterDate(""); setFilterCategory(""); setSearchTerm(""); }}
                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition text-[10px] font-black uppercase tracking-tighter"
                                >
                                    ✕ Clear
                                </button>
                            )}
                            <div className="ml-2 pl-4 border-l border-white/10 hidden md:flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                {tasks.length} Results
                            </div>
                        </div>
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
