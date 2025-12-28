"use client";
import React, { useEffect, useState } from "react";
import CategoryStats from "@/components/CategoryStats";
import Link from "next/link";

import { format } from "date-fns";

export default function AnalyticsPage() {
    const [data, setData] = useState<{
        globalStats: Record<string, number>;
        userActivity: Array<{
            id: string;
            name: string;
            totalTasks: number;
            tasks: Array<{
                id: string;
                description: string;
                category: string;
                ticketNumber?: string;
                status: string;
                date: string;
            }>
        }>;
        currentUserId: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{
        id: string;
        name: string;
        totalTasks: number;
        tasks: Array<{
            id: string;
            description: string;
            category: string;
            ticketNumber?: string;
            status: string;
            date: string;
        }>
    } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/analytics");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const sharedTicketNumbers = React.useMemo(() => {
        if (!data) return new Set<string>();
        const ticketMap = new Map<string, Set<string>>(); // Ticket -> Set<UserId>

        data.userActivity.forEach(user => {
            user.tasks.forEach(task => {
                if (task.category === 'Axios' && task.ticketNumber) {
                    if (!ticketMap.has(task.ticketNumber)) {
                        ticketMap.set(task.ticketNumber, new Set());
                    }
                    ticketMap.get(task.ticketNumber)?.add(user.id);
                }
            });
        });

        const shared = new Set<string>();
        ticketMap.forEach((userIds, ticket) => {
            if (userIds.size > 1) {
                shared.add(ticket);
            }
        });
        return shared;
    }, [data]);

    const getCategoryCounts = (tasks: any[]) => {
        const counts: Record<string, number> = {};
        tasks.forEach(t => {
            const cat = t.category || "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    };

    const groupTasksByCategory = (tasks: any[]) => {
        const grouped: Record<string, any[]> = {};
        tasks.forEach(t => {
            const cat = t.category || "Uncategorized";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t);
        });
        return grouped;
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 glass p-6 rounded-2xl">
                    <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Team Analytics</h1>
                    <Link href="/dashboard" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition backdrop-blur-sm font-semibold">
                        Back to Dashboard
                    </Link>
                </div>

                {loading || !data ? (
                    <div className="text-center text-white text-xl animate-pulse mt-12">Loading team data...</div>
                ) : (
                    <div className="space-y-8">
                        <CategoryStats stats={data.globalStats} title="Global Task Distribution" />

                        <div className="glass p-8 rounded-2xl">
                            <h2 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">User Activity Board</h2>
                            <div className="grid gap-4">
                                {data.userActivity.map(user => {
                                    const isCurrentUser = data.currentUserId === user.id;
                                    const catCounts = getCategoryCounts(user.tasks);

                                    return (
                                        <div key={user.id} className="rounded-xl overflow-hidden hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-white/10 group">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="w-full p-5 flex justify-between items-center"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isCurrentUser ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg shadow-green-500/30' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition">{user.name}</h3>
                                                            {isCurrentUser && (
                                                                <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap mt-2">
                                                            {Object.entries(catCounts).map(([cat, count]) => (
                                                                <span key={cat} className="text-xs bg-black/30 border border-white/10 px-2 py-1 rounded-md text-gray-300">
                                                                    {cat}: <b className="text-white">{count}</b>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="text-sm text-blue-400 group-hover:translate-x-1 transition-transform font-medium bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                                    View Details &rarr;
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* User Detail Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <div className="glass-panel w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-white/20">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedUser.name}'s Tasks</h2>
                                    <p className="text-sm text-gray-400">Total Tasks: <span className="text-white font-bold">{selectedUser.totalTasks}</span></p>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="text-white/50 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full transition flex items-center justify-center">
                                    &times;
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {selectedUser.tasks.length === 0 ? (
                                    <p className="text-center text-gray-500 italic py-8">No tasks found for this user.</p>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(groupTasksByCategory(selectedUser.tasks)).map(([category, tasks]) => (
                                            <div key={category} className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    {category}
                                                </h3>
                                                <div className="space-y-3">
                                                    {tasks.map(task => (
                                                        <div key={task.id} className="flex justify-between items-start text-sm bg-white/5 p-4 rounded-lg hover:bg-white/10 transition border border-white/5">
                                                            <div className="flex-1 pr-6">
                                                                <p className="text-gray-200 leading-relaxed font-medium">
                                                                    {task.description}
                                                                </p>
                                                                {task.category === 'Axios' && task.ticketNumber && sharedTicketNumbers.has(task.ticketNumber) && (
                                                                    <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-300 text-xs font-bold px-2 py-1 rounded border border-yellow-500/20">
                                                                        <span className="text-yellow-500">⚠</span> Shared Ticket #{task.ticketNumber}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right whitespace-nowrap pl-4 border-l border-white/10">
                                                                <div className={`text-xs font-bold mb-1.5 px-2 py-0.5 rounded-full inline-block ${task.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                                                        task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                                            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                                    }`}>
                                                                    {task.status}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mt-1">
                                                                    {format(new Date(task.date), 'MMM dd, HH:mm')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/5 rounded-b-2xl text-right">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium border border-white/10"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 p-8 glass rounded-2xl">
                    <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                        <span className="text-blue-400">ℹ</span> About this Dashboard
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                        This dedicated analytics hub provides real-time visibility into the organization's productivity.
                        It aggregates task data across all users, enabling you to identify bottlenecks, track category distribution,
                        and drill down into individual performance metrics.
                        <strong className="text-white/80 block mt-2">Click on any user card above to reveal their specific task breakdown.</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
