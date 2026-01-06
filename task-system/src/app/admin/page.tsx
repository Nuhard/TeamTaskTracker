"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAdmin, setActiveAdmin] = useState<any>(null);

    // Form State for Create
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [activeTab, setActiveTab] = useState("productivity"); // productivity, feed, directory, audit
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [msg, setMsg] = useState("");
    const [statsError, setStatsError] = useState("");
    const [batchLoading, setBatchLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [toasts, setToasts] = useState<any[]>([]);
    const [showUserModal, setShowUserModal] = useState<any>(null); // For Drilldown
    const [prevTaskCount, setPrevTaskCount] = useState(0);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [selectedCsvColumns, setSelectedCsvColumns] = useState<string[]>([
        "id", "userName", "userEmail", "description", "category", "ticket", "status", "date"
    ]);

    const addToast = (msg: string, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const fetchMasterTasks = async (status = "ALL") => {
        try {
            const query = new URLSearchParams({ status });
            if (dateRange.start) query.set("startDate", dateRange.start);
            if (dateRange.end) query.set("endDate", dateRange.end);

            const res = await fetch(`/api/admin/tasks?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setAllTasks(data);

                // Automation: Check for new tasks
                if (prevTaskCount > 0 && data.length > prevTaskCount) {
                    const diff = data.length - prevTaskCount;
                    addToast(`${diff} new task(s) recorded live!`, "info");
                }
                setPrevTaskCount(data.length);
            }
        } catch (e) {
            console.error("Master Feed Error:", e);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch("/api/admin/audit");
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.logs || data);
            }
        } catch (e) {
            console.error("Audit Log Error:", e);
        }
    };

    const fetchStats = async () => {
        try {
            const query = new URLSearchParams();
            if (dateRange.start) query.set("startDate", dateRange.start);
            if (dateRange.end) query.set("endDate", dateRange.end);

            const statsRes = await fetch(`/api/admin/stats?${query.toString()}`);
            if (!statsRes.ok) {
                const errText = await statsRes.text();
                setStatsError(errText);
                return;
            }
            const statsData = await statsRes.json();
            setStats(statsData);
        } catch (e) {
            console.error("Stats Error:", e);
        }
    };

    const fetchUsers = async () => {
        try {
            const usersRes = await fetch("/api/admin/users");
            if (usersRes.ok) {
                setUsers(await usersRes.json());
            }
        } catch (e) {
            console.error("Users Error:", e);
        }
    };

    const handleRefreshAll = async () => {
        setIsSyncing(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchMasterTasks(filterStatus),
                fetchUsers(),
                fetchAuditLogs()
            ]);
            setMsg("Dashboard Synchronized");
            setTimeout(() => setMsg(""), 3000);
        } catch (error) {
            setMsg("Sync Failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDatePreset = (preset: string) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (preset) {
            case 'today':
                start = today;
                end = today;
                break;
            case 'week':
                start = new Date(today);
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            default:
                setDateRange({ start: "", end: "" });
                return;
        }

        setDateRange({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        });
        addToast(`Range set to ${preset}`, "info");
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const meRes = await fetch("/api/auth/me");
                if (meRes.ok) setActiveAdmin(await meRes.json());

                await Promise.all([
                    fetchStats(),
                    fetchUsers(),
                    fetchMasterTasks(filterStatus),
                    fetchAuditLogs()
                ]);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filterStatus, dateRange]); // Re-fetch on date change

    // Live Automation: Polling Interval (60s)
    useEffect(() => {
        const interval = setInterval(() => {
            handleRefreshAll();
        }, 60000);
        return () => clearInterval(interval);
    }, [filterStatus, dateRange]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                const created = await res.json();
                setUsers([created, ...users]);
                setNewUser({ name: "", email: "", password: "", role: "USER" });
                setMsg("User created successfully!");
                setTimeout(() => setMsg(""), 3000);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error creating user");
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const url = isCreating ? "/api/admin/users" : `/api/admin/users/${editingUser.id}`;
        const method = isCreating ? "POST" : "PUT";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingUser)
            });

            if (res.ok) {
                setShowEditModal(false);
                setEditingUser(null);
                const usersRes = await fetch("/api/admin/users");
                if (usersRes.ok) {
                    setUsers(await usersRes.json());
                }
            } else {
                const err = await res.json();
                alert(err.error || "Operation failed");
            }
        } catch (e) {
            alert("Network error");
        }
    };

    const startEdit = (user: any) => {
        setEditingUser({ ...user, password: "" });
        setIsCreating(false);
        setShowEditModal(true);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete user");
            }
        } catch (e) {
            alert("Error deleting user");
        }
    };

    const handleDownloadReport = () => {
        const columnsQuery = selectedCsvColumns.join(",");
        window.open(`/api/admin/reports?columns=${columnsQuery}`, "_blank");
        setShowCsvModal(false);
        addToast("CSV Report Generated", "success");
    };

    const toggleCsvColumn = (column: string) => {
        setSelectedCsvColumns(prev =>
            prev.includes(column)
                ? prev.filter(c => c !== column)
                : [...prev, column]
        );
    };

    const handleBatchAction = async (action: string, role?: string) => {
        if (selectedUserIds.length === 0) return;
        if (!confirm(`Perform ${action} on ${selectedUserIds.length} users?`)) return;

        setBatchLoading(true);
        try {
            const res = await fetch("/api/admin/users/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: selectedUserIds, action, role })
            });
            if (res.ok) {
                const usersRes = await fetch("/api/admin/users");
                if (usersRes.ok) setUsers(await usersRes.json());
                setSelectedUserIds([]);
                fetchAuditLogs();
                setMsg(`Batch ${action} completed!`);
                setTimeout(() => setMsg(""), 3000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setBatchLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    if (loading) return <div className="p-8 dark:text-white">Loading Admin Panel...</div>;

    if (statsError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="glass p-8 rounded-2xl max-w-md w-full text-center border-red-500/50 border">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Access Issue</h1>
                    <p className="text-gray-300 mb-6">{statsError}</p>
                    <button onClick={handleLogout} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold w-full transition">
                        Logout & Switch Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-4 glass p-3 md:p-4 rounded-xl gap-3 border border-white/5">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Admin Command Center</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Logged in as:</span>
                            <span className="text-[9px] text-blue-400 font-mono italic">{activeAdmin?.name || 'Admin'}</span>
                            <span className="text-[10px] text-gray-600 font-mono">({activeAdmin?.email || '...'})</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4 items-center">
                        <ThemeToggle />
                        <button
                            onClick={handleRefreshAll}
                            disabled={isSyncing}
                            className={`flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg transition backdrop-blur-sm font-semibold text-sm ${isSyncing ? 'opacity-50' : ''}`}
                        >
                            <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button onClick={() => router.push('/calendar')} className="flex-1 sm:flex-initial px-4 md:px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg transition backdrop-blur-sm font-semibold text-sm">
                            📅 Calendar
                        </button>
                        <button onClick={() => setShowCsvModal(true)} className="flex-1 sm:flex-initial px-4 md:px-6 py-2 bg-green-500/20 hover:bg-green-600/30 text-green-400 border border-green-500/50 rounded-lg transition backdrop-blur-sm font-semibold text-sm">
                            CSV Report
                        </button>
                        <button onClick={() => router.push('/dashboard')} className="flex-1 sm:flex-initial px-4 md:px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition backdrop-blur-sm font-semibold text-sm">
                            Exit Admin
                        </button>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition backdrop-blur-sm font-semibold text-sm">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Compact Global Status */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { label: 'Pending', val: stats?.pendingTasks, col: 'yellow', status: 'PENDING' },
                        { label: 'Progress', val: stats?.inProgressTasks, col: 'blue', status: 'IN_PROGRESS' },
                        { label: 'Done', val: stats?.completedTasks, col: 'green', status: 'COMPLETED' },
                        { label: 'Total', val: stats?.totalTasks, col: 'purple', status: 'ALL' }
                    ].map(s => (
                        <button
                            key={s.label}
                            onClick={() => setFilterStatus(s.status)}
                            className={`flex-1 min-w-[100px] p-2.5 rounded-lg border transition group text-left ${filterStatus === s.status ? `bg-white/10 border-${s.col}-500/50 shadow-md` : `bg-white/5 border-white/5 hover:bg-white/10`}`}
                        >
                            <h3 className="text-gray-500 text-[9px] uppercase font-bold tracking-wider group-hover:text-gray-300 transition">{s.label}</h3>
                            <p className={`text-lg font-black text-${s.col === 'purple' ? 'white' : s.col + '-400'} mt-0.5`}>{s.val || 0}</p>
                        </button>
                    ))}
                </div>

                {/* Productivity Heatmap */}
                <div className="mb-4 glass p-3 rounded-xl border border-white/5">
                    <h2 className="text-sm font-bold mb-2 text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Weekly Productivity Grid
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                        {stats?.weeklyStats?.map((day: any, i: number) => {
                            const date = new Date(day.date);
                            const dayTasks = day.count;
                            const intensity = Math.min(dayTasks * 20, 100);

                            return (
                                <div key={i} className="flex-1 min-w-[70px] text-center">
                                    <div
                                        className="h-10 w-full rounded-lg border border-white/10 transition-all duration-500 mb-1.5 relative flex items-center justify-center"
                                        style={{ backgroundColor: `rgba(34, 197, 94, ${intensity / 100})`, boxShadow: intensity > 0 ? `0 0 10px rgba(34, 197, 94, ${intensity / 200})` : 'none' }}
                                    >
                                        <span className="text-[10px] font-black text-white drop-shadow-lg">{dayTasks}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">{format(date, 'EEE')}</span>
                                    <span className="block text-[7px] text-gray-600">{format(date, 'MMM dd')}</span>
                                </div>
                            );
                        }) || (
                                // Fallback skeleton or empty state if stats not loaded yet
                                Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="flex-1 min-w-[70px] text-center animate-pulse">
                                        <div className="h-10 w-full rounded-lg bg-white/5 mb-1.5" />
                                        <div className="h-2 w-4 bg-white/5 mx-auto rounded" />
                                    </div>
                                ))
                            )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-black/30 p-1.5 rounded-xl border border-white/5 mb-8 gap-1 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'productivity', label: 'Productivity', icon: '📊' },
                        { id: 'feed', label: 'Master Feed', icon: '🌐' },
                        { id: 'directory', label: 'User Directory', icon: '👥' },
                        { id: 'audit', label: 'Security Audit', icon: '🛡️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[600px] animate-in fade-in duration-500">
                    {activeTab === 'productivity' && (
                        <div className="space-y-6">
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                                <div className="space-y-0.5 relative">
                                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                                        <span className="p-1.5 bg-indigo-500/20 rounded-lg text-base">📊</span>
                                        Reporting Console
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.15em] ml-8">Surgical Data Analysis</p>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                                    {/* Presets */}
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-stretch md:self-auto">
                                        {[
                                            { id: 'today', label: 'Today' },
                                            { id: 'week', label: '7 Days' },
                                            { id: 'month', label: 'MTD' }
                                        ].map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleDatePreset(p.id)}
                                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all rounded-lg hover:bg-white/5"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Range */}
                                    <div className="flex items-center gap-3 bg-black/60 p-2 rounded-2xl border border-white/10 shadow-inner w-full md:w-auto">
                                        <div className="flex items-center gap-3 px-3">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-indigo-400 font-black uppercase mb-0.5 ml-0.5">Start</span>
                                                <input
                                                    type="date"
                                                    className="bg-transparent text-xs text-white border-0 font-bold focus:ring-0 p-0 w-[100px]"
                                                    value={dateRange.start}
                                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                />
                                            </div>
                                            <span className="text-gray-700 font-black">/</span>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-purple-400 font-black uppercase mb-0.5 ml-0.5">End</span>
                                                <input
                                                    type="date"
                                                    className="bg-transparent text-xs text-white border-0 font-bold focus:ring-0 p-0 w-[100px]"
                                                    value={dateRange.end}
                                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {(dateRange.start || dateRange.end) ? (
                                            <button
                                                onClick={() => handleDatePreset('clear')}
                                                className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
                                            >
                                                ✕
                                            </button>
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center text-gray-600 bg-white/5 rounded-xl border border-white/5">
                                                📅
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                                {["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"].map((cat) => {
                                    const count = stats?.categoryStats?.find((c: any) => c.name === cat)?.value || 0;
                                    return (
                                        <div key={cat} className="glass p-3 md:p-4 rounded-xl border-t-2 border-indigo-500 hover:bg-white/10 transition group">
                                            <h3 className="text-gray-500 text-[9px] uppercase tracking-widest font-bold mb-1 group-hover:text-indigo-300 transition">{cat}</h3>
                                            <p className="text-xl md:text-2xl font-black text-white">{count}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-300 px-2 flex items-center gap-2">
                                    SRE Engineer Output
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {stats?.userReports?.map((userReq: any) => (
                                        <div key={userReq.id} className="glass p-4 rounded-2xl flex flex-col hover:bg-white/5 transition border border-white/5">
                                            <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-2">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                                    {userReq.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-sm text-white truncate">{userReq.name}</h3>
                                                    <p className="text-[10px] text-gray-500 truncate">{userReq.email}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {userReq.chartData.map((item: any) => (
                                                    <div key={item.name} className="w-full">
                                                        <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                                                            <span>{item.name}</span>
                                                            <span>{item.value}</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full transition-all duration-500" style={{ width: `${(item.value / (userReq.totalTasks || 1)) * 100}%`, backgroundColor: item.color }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'feed' && (
                        <div className="glass p-4 md:p-6 rounded-2xl border border-white/5 shadow-2xl">
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    Global Master Feed
                                    {filterStatus !== "ALL" && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${filterStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : filterStatus === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                            Filtering: {filterStatus}
                                        </span>
                                    )}
                                </h2>
                                <span className="text-[10px] text-gray-500 font-mono italic">Showing last 100 entries</span>
                            </div>
                            <div className="overflow-x-auto min-h-[500px]">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="text-gray-500 text-[10px] uppercase font-black border-b border-white/10">
                                            <th className="py-2 px-2">Time</th>
                                            <th className="py-2 px-2">SRE Engineer</th>
                                            <th className="py-2 px-2">Task</th>
                                            <th className="py-2 px-2">Cat</th>
                                            <th className="py-2 px-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px]">
                                        {allTasks.map(t => (
                                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition group">
                                                <td className="py-2 px-2 text-gray-500 whitespace-nowrap">{format(new Date(t.date), 'MMM dd HH:mm')}</td>
                                                <td className="py-2 px-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white">{t.user?.name}</span>
                                                        <span className="text-[9px] text-gray-600 hidden group-hover:block transition">{t.user?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-300">
                                                    <div className="max-w-[250px] truncate" title={t.description}>{t.description}</div>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <span className="bg-white/5 px-2 py-0.5 rounded text-gray-400 text-[9px]">{t.category}</span>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status === 'COMPLETED' ? 'text-green-400 bg-green-500/10' : t.status === 'IN_PROGRESS' ? 'text-blue-400 bg-blue-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {allTasks.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500 italic">No tasks found for current filter</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'directory' && (
                        <div className="space-y-8">
                            {/* Compact Create User Form */}
                            <div className="glass p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex flex-col xl:flex-row items-center gap-4">
                                    <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-r border-white/10 pr-4 shrink-0 hidden xl:block">Add User</h2>
                                    <form onSubmit={handleCreateUser} className="flex-1 flex flex-col md:flex-row items-center gap-2 w-full">
                                        <input
                                            className="flex-[2] min-w-[150px] p-2.5 rounded-lg text-xs bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition w-full shadow-inner"
                                            value={newUser.name}
                                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                            required
                                            placeholder="Full Name"
                                        />
                                        <input
                                            className="flex-[3] min-w-[200px] p-2.5 rounded-lg text-xs bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition w-full shadow-inner"
                                            type="email"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            required
                                            placeholder="Email Address"
                                        />
                                        <input
                                            className="flex-[2] min-w-[150px] p-2.5 rounded-lg text-xs bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition w-full shadow-inner"
                                            type="password"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                            placeholder="Password"
                                        />
                                        <select
                                            className="flex-none w-full md:w-[110px] p-2.5 rounded-lg text-xs bg-black/20 border border-white/10 text-gray-400 focus:outline-none focus:border-blue-500/50 transition cursor-pointer"
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        >
                                            <option value="USER">User Role</option>
                                            <option value="ADMIN">Admin Role</option>
                                        </select>
                                        <button type="submit" className="flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 shrink-0 w-full md:w-auto">
                                            Create User
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="glass p-4 md:p-6 rounded-2xl border border-white/5 shadow-2xl">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-white/5 pb-3 gap-4">
                                    <h2 className="text-xl font-bold text-white">User Directory</h2>
                                    {selectedUserIds.length > 0 && (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <button
                                                onClick={() => handleBatchAction("CHANGE_ROLE", "ADMIN")}
                                                className="px-3 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-black uppercase tracking-widest hover:bg-purple-600/30 transition"
                                                disabled={batchLoading}
                                            >
                                                Make Admin
                                            </button>
                                            <button
                                                onClick={() => handleBatchAction("CHANGE_ROLE", "USER")}
                                                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/30 transition"
                                                disabled={batchLoading}
                                            >
                                                Make User
                                            </button>
                                            <button
                                                onClick={() => handleBatchAction("DELETE")}
                                                className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition"
                                                disabled={batchLoading}
                                            >
                                                Delete ({selectedUserIds.length})
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase font-black">
                                                <th className="py-3 px-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50"
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedUserIds(users.map(u => u.id));
                                                            else setSelectedUserIds([]);
                                                        }}
                                                        checked={selectedUserIds.length === users.length && users.length > 0}
                                                    />
                                                </th>
                                                <th className="py-3 px-2">User</th>
                                                <th className="py-3 px-2">Role</th>
                                                <th className="py-3 px-2">Joined</th>
                                                <th className="py-3 px-2">Last Login</th>
                                                <th className="py-3 px-2 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {users.map(u => (
                                                <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition ${selectedUserIds.includes(u.id) ? 'bg-blue-500/5' : ''}`}>
                                                    <td className="py-3 px-2">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50"
                                                            checked={selectedUserIds.includes(u.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                                                                else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex flex-col cursor-pointer group/name" onClick={() => setShowUserModal(u)}>
                                                            <span className="font-bold text-white group-hover/name:text-blue-400 transition">{u.name}</span>
                                                            <span className="text-[10px] text-gray-500">{u.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-gray-500 font-mono">{format(new Date(u.createdAt), 'MMM dd, yy')}</td>
                                                    <td className="py-3 px-2 text-gray-400 font-mono italic">
                                                        {u.lastLogin ? format(new Date(u.lastLogin), 'MMM dd HH:mm') : 'Never'}
                                                    </td>
                                                    <td className="py-3 px-2 text-right space-x-2">
                                                        <button onClick={() => startEdit(u)} className="text-white/40 hover:text-white transition">Edit</button>
                                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500/40 hover:text-red-500 transition">Del</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="glass p-4 md:p-6 rounded-2xl border border-white/5 shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 text-white border-b border-white/5 pb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Security Audit Logs
                            </h2>
                            <div className="space-y-4 min-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                                {auditLogs.map((log: any) => (
                                    <div key={log.id} className="flex items-start gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition group">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{log.action}</span>
                                                <span className="text-[9px] text-gray-500 italic">{format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}</span>
                                            </div>
                                            <p className="text-xs text-blue-300 font-medium mb-1">Performed by: {log.user?.name || "System"}</p>
                                            <p className="text-[10px] text-gray-400 leading-tight bg-black/20 p-2 rounded border border-white/5">{log.details}</p>
                                        </div>
                                    </div>
                                ))}
                                {auditLogs.length === 0 && (
                                    <p className="text-center py-8 text-gray-500 italic">No audit logs recorded.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Toast System */}
                <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-full duration-500 ${toast.type === 'info' ? 'bg-blue-600/20 border-blue-500/30 text-blue-100' : 'bg-green-600/20 border-green-500/30 text-green-100'}`}>
                            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            <span className="text-sm font-bold tracking-tight">{toast.msg}</span>
                        </div>
                    ))}
                </div>

                {/* Deep Dive User Modal */}
                {
                    showUserModal && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUserModal(null)} />
                            <div className="glass w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                                <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                                    <button onClick={() => setShowUserModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition">✕</button>
                                </div>
                                <div className="px-8 pb-8 -mt-10 relative">
                                    <div className="flex items-end gap-6 mb-8">
                                        <div className="w-24 h-24 rounded-3xl bg-gray-900 border-4 border-black flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                                            {showUserModal.name.charAt(0)}
                                        </div>
                                        <div className="pb-2">
                                            <h2 className="text-3xl font-black text-white leading-tight">{showUserModal.name}</h2>
                                            <p className="text-blue-400 font-mono text-xs">{showUserModal.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Impact</p>
                                            <p className="text-2xl font-black text-white">{showUserModal.totalTasks}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Role Status</p>
                                            <span className="text-xs font-bold text-purple-400 px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">{showUserModal.role}</span>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 col-span-2">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Last System Touch</p>
                                            <p className="text-xs font-mono text-gray-300">
                                                {showUserModal.lastLogin ? format(new Date(showUserModal.lastLogin), 'PPP HH:mm:ss') : "Never"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Category Performance Matrix</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {showUserModal.chartData?.map((item: any) => (
                                                <div key={item.name} className="w-full bg-white/5 p-3 rounded-xl">
                                                    <div className="flex justify-between text-xs font-bold text-white mb-2">
                                                        <span>{item.name}</span>
                                                        <span className="text-gray-500">{item.value} Tasks</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${(item.value / (showUserModal.totalTasks || 1)) * 100}%`,
                                                                backgroundColor: item.color
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* CSV Column Selector Modal */}
            {showCsvModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="glass w-full max-w-lg p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600" />
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <span className="text-2xl">📊</span>
                                    CSV Export Options
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">Select columns to include in your report</p>
                            </div>
                            <button onClick={() => setShowCsvModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {[
                                { id: "id", label: "Task ID" },
                                { id: "userName", label: "User Name" },
                                { id: "userEmail", label: "User Email" },
                                { id: "description", label: "Description" },
                                { id: "category", label: "Category" },
                                { id: "ticket", label: "Ticket Number" },
                                { id: "status", label: "Status" },
                                { id: "date", label: "Date" }
                            ].map(col => (
                                <label
                                    key={col.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${selectedCsvColumns.includes(col.id) ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCsvColumns.includes(col.id)}
                                        onChange={() => toggleCsvColumn(col.id)}
                                        className="rounded border-white/20 bg-white/5 text-green-600 focus:ring-green-500/50"
                                    />
                                    <span className="text-sm font-semibold text-white">{col.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <button
                                onClick={() => setSelectedCsvColumns(["id", "userName", "userEmail", "description", "category", "ticket", "status", "date"])}
                                className="text-xs text-gray-400 hover:text-white transition font-semibold"
                            >
                                Select All
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCsvModal(false)}
                                    className="px-5 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDownloadReport}
                                    disabled={selectedCsvColumns.length === 0}
                                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-lg shadow-green-500/20 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-white text-center">Edit Profile</h2>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <input className="w-full p-2.5 rounded-lg text-sm bg-black/20 border border-white/10 text-white" value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} required placeholder="Name" />
                            <input className="w-full p-2.5 rounded-lg text-sm bg-black/20 border border-white/10 text-white" type="email" value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required placeholder="Email" />
                            <input className="w-full p-2.5 rounded-lg text-sm bg-black/20 border border-white/10 text-white" type="password" placeholder="New Password (optional)" value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} />
                            <select className="w-full p-2.5 rounded-lg text-sm bg-black/20 border border-white/10 text-white" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
