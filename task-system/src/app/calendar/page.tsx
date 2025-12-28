"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

// Use dynamic import to prevent hydration errors (server/client mismatch)
const Calendar = dynamic(
    () => import("react-big-calendar").then((mod) => mod.Calendar),
    {
        ssr: false,
        loading: () => <div className="h-full flex items-center justify-center text-gray-400">Initializing Calendar View...</div>
    }
);

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Task {
    id: string;
    description: string;
    category: string;
    status: string;
    date: string;
}

export default function CalendarPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Explicit state for view and date
    const [currentView, setCurrentView] = useState<any>(Views.MONTH);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch("/api/tasks");
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
                console.log("DEBUG: Tasks loaded for calendar:", data.length);
            }
        } catch (e) {
            console.error("DEBUG: Error fetching tasks:", e);
        } finally {
            setLoading(false);
        }
    };

    // Memoize events
    const events = useMemo(() => {
        return tasks.map(task => {
            const start = new Date(task.date);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
            return {
                id: task.id,
                title: `${task.category}: ${task.description.substring(0, 30)}`,
                start,
                end,
                allDay: false, // Ensure they show up in time slots
                resource: task,
            };
        });
    }, [tasks]);

    const eventStyleGetter = useCallback((event: any) => {
        const task = event.resource as Task;
        let backgroundColor = '#fbbf24';

        if (task.status === 'COMPLETED') backgroundColor = '#10b981';
        else if (task.status === 'IN_PROGRESS') backgroundColor = '#3b82f6';

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.85,
                color: 'white',
                border: 'none',
                display: 'block',
                fontSize: '0.75rem',
                padding: '2px 4px',
            }
        };
    }, []);

    const handleNavigate = useCallback((newDate: Date) => {
        setCurrentDate(newDate);
    }, []);

    const handleViewChange = useCallback((newView: any) => {
        console.log("DEBUG: Setting view to:", newView);
        setCurrentView(newView);
    }, []);

    const handleSelectEvent = useCallback((event: any) => {
        const task = event.resource as Task;
        alert(`任务: ${task.description}\n类别: ${task.category}\n状态: ${task.status}\n时间: ${format(new Date(task.date), 'PPpp')}`);
    }, []);

    const handleSelectSlot = useCallback((slotInfo: any) => {
        if (confirm(`要在 ${format(slotInfo.start, 'PPP')} 创建新任务吗？`)) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 glass p-6 rounded-2xl gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Task Timeline</h1>
                        <p className="text-sm text-gray-400 mt-1">Switch views to manage your schedule</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <ThemeToggle />
                        <Link href="/dashboard" className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/50 rounded-lg transition text-sm font-semibold">
                            Dashboard
                        </Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition text-sm font-semibold">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="glass p-4 rounded-2xl shadow-2xl overflow-hidden" style={{ height: '750px' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={currentView}
                        onView={handleViewChange}
                        date={currentDate}
                        onNavigate={handleNavigate}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                        popup
                        style={{ height: '100%' }}
                        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                        step={60}
                        showMultiDayTimes
                    />
                </div>

                <div className="mt-6 flex justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-xs text-gray-300">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-xs text-gray-300">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-xs text-gray-300">Completed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
