"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import ThemeToggle from "@/components/ThemeToggle";
// import { BarChart, Bar, XAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State for Create
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });

    // Form State for Edit
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [msg, setMsg] = useState("");
    const [statsError, setStatsError] = useState("");

    // Recharts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stats
                const statsRes = await fetch("/api/admin/stats");
                if (!statsRes.ok) {
                    const errText = await statsRes.text();
                    console.error("Admin Stats Fetch Failed:", statsRes.status, errText);
                    alert(`Failed to fetch stats: ${statsRes.status} ${errText}`);
                    setStatsError(errText);
                    return;
                }
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch Users
                const usersRes = await fetch("/api/admin/users");
                if (usersRes.ok) {
                    setUsers(await usersRes.json());
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            console.error("Error creating user:", e);
            alert("Error creating user");
        }
    };

    // Combined handleCreateUser and handleUpdateUser into one
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const url = isCreating ? "/api/admin/users" : `/api/admin/users/${editingUser.id}`;
        const method = isCreating ? "POST" : "PUT";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingUser) // sending password only if user typed it
            });

            if (res.ok) {
                // const updated = await res.json(); // Not used directly, refreshing all users
                setShowEditModal(false);
                setEditingUser(null);
                // setMsg(`User ${isCreating ? 'created' : 'updated'} successfully!`); // Re-add if msg state is desired
                // setTimeout(() => setMsg(""), 3000);

                // Refresh users list after create/update
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
        // Prepare editable copy, password empty initially
        setEditingUser({ ...user, password: "" });
        setIsCreating(false); // Indicate we are editing
        setShowEditModal(true);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
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
        window.open("/api/admin/reports", "_blank");
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    if (loading) return <div className="p-8 dark:text-white">Loading Admin Panel...</div>;

    // Render error message if statsError is present
    if (statsError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
                <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border-red-500/50 border">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Access Issue</h1>
                    <p className="text-gray-300 mb-6">{statsError}</p>
                    <p className="text-sm text-gray-400 mb-6">If you are seeing this, you might be logged in as a Standard User. Please log out and sign in with an Admin account.</p>
                    <button onClick={handleLogout} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold w-full transition">
                        Logout & Switch Account
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="mt-4 text-gray-400 hover:text-white underline text-sm">
                        Go to My Dashboard
                    </button>
                </div>
            </div>
        );
    }

    console.log("DEBUG: Admin Stats Received:", stats);

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 glass p-6 rounded-2xl">
                    <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Admin Command Center</h1>
                    <div className="flex gap-4 items-center">
                        <ThemeToggle />
                        <button onClick={() => router.push('/calendar')} className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg transition backdrop-blur-sm font-semibold">
                            📅 Calendar
                        </button>
                        <button onClick={handleDownloadReport} className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-lg transition backdrop-blur-sm font-semibold">
                            Download CSV
                        </button>
                        <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition backdrop-blur-sm font-semibold">
                            Exit Admin
                        </button>
                    </div>
                </div>



                {/* Global Status Widgets */}
                <h2 className="text-xl font-bold mb-4 text-gray-300 px-2">System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="glass p-6 rounded-2xl border-l-4 border-yellow-500 hover:bg-white/5 transition">
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Pending Tasks</h3>
                        <p className="text-4xl font-bold text-yellow-400 mt-2">{stats?.pendingTasks || 0}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-l-4 border-blue-500 hover:bg-white/5 transition">
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">In Progress</h3>
                        <p className="text-4xl font-bold text-blue-400 mt-2">{stats?.inProgressTasks || 0}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-l-4 border-green-500 hover:bg-white/5 transition">
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Completed</h3>
                        <p className="text-4xl font-bold text-green-400 mt-2">{stats?.completedTasks || 0}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-l-4 border-purple-500 hover:bg-white/5 transition">
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Volume</h3>
                        <p className="text-4xl font-bold text-white mt-2">{stats?.totalTasks || 0}</p>
                    </div>
                </div>

                {/* Category Status Widgets */}
                <h2 className="text-xl font-bold mb-4 text-gray-300 px-2">Category Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
                    {["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"].map((cat) => {
                        const count = stats?.categoryStats?.find((c: any) => c.name === cat)?.value || 0;
                        return (
                            <div key={cat} className="glass p-4 rounded-xl border-t-4 border-indigo-500 hover:bg-white/5 transition">
                                <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-2">{cat}</h3>
                                <p className="text-2xl font-bold text-white">{count}</p>
                            </div>
                        );
                    })}
                </div>

                {/* User Reports Section */}
                <h2 className="text-xl font-bold mb-4 text-gray-300 px-2">User Work Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {stats?.userReports?.map((userReq: any) => {
                        const chartData = userReq.chartData;
                        return (
                            <div key={userReq.id} className="glass p-6 rounded-2xl flex flex-col items-center hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
                                <div className="w-full mb-4 border-b border-white/10 pb-4 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                                        {userReq.name.charAt(0)}
                                    </div>
                                    <h3 className="font-bold text-lg text-white">{userReq.name}</h3>
                                    <p className="text-sm text-gray-400">{userReq.email}</p>
                                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-blue-200">
                                        {userReq.totalTasks} Tasks Logged
                                    </div>
                                </div>

                                <div className="w-full mt-4 space-y-4">
                                    {userReq.totalTasks > 0 ? (
                                        chartData.map((item: any) => (
                                            <div key={item.name} className="w-full">
                                                <div className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                                                    <span>{item.name}</span>
                                                    <span>{item.value}</span>
                                                </div>
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${(item.value / userReq.totalTasks) * 100}%`,
                                                            backgroundColor: item.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-[150px] flex items-center justify-center text-gray-500 text-sm italic border border-dashed border-white/10 rounded-xl bg-black/20">
                                            No performance data yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create User Form (now handled by modal) */}
                    <div className="glass p-8 rounded-2xl h-fit">
                        <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">Create New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    className="w-full p-2.5 rounded-lg text-sm bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    className="w-full p-2.5 rounded-lg text-sm bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                <input
                                    className="w-full p-2.5 rounded-lg text-sm"
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                <select
                                    className="w-full p-2.5 rounded-lg text-sm"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition font-bold shadow-lg shadow-blue-500/20 mt-4">
                                Create User
                            </button>
                        </form>
                    </div>

                </div>

                {/* User List Management */}
                <div className="mt-8 glass p-8 rounded-2xl">
                    <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-2">Manage Users</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                    <th className="py-3 px-4">Name</th>
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Created At</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition duration-150">
                                        <td className="py-4 px-4 font-medium text-white">{u.name}</td>
                                        <td className="py-4 px-4 text-gray-300">{u.email}</td>
                                        <td className="py-4 px-4">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-400">{format(new Date(u.createdAt), 'yyyy-MM-dd')}</td>
                                        <td className="py-4 px-4 text-right space-x-3">
                                            <button
                                                onClick={() => startEdit(u)}
                                                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-red-400 hover:text-red-300 font-medium hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >

            {/* Edit Modal */}
            {
                showEditModal && editingUser && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-white/20 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-white text-center">Edit User</h2>
                            <form onSubmit={handleUpdateUser} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg text-sm"
                                        value={editingUser.name || ''}
                                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg text-sm"
                                        type="email"
                                        value={editingUser.email || ''}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg text-sm"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={editingUser.password || ''}
                                        onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg text-sm"
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-bold shadow-lg shadow-blue-500/25"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
