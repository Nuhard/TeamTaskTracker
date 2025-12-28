import React, { useState } from 'react';
import { format } from 'date-fns';
import CommentSection from './CommentSection';

interface Task {
    id: string;
    description: string;
    category: string;
    status: string;
    date: string;
}

interface Props {
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
}

export default function TaskTable({ tasks, onEdit, onDelete }: Props) {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const toggleExpand = (taskId: string) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    return (
        <div className="glass rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider bg-black/20">
                            <th className="px-6 py-4 font-semibold">Description</th>
                            <th className="px-6 py-4 font-semibold">Category</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {tasks.map((task) => (
                            <React.Fragment key={task.id}>
                                <tr className="border-b border-white/5 hover:bg-white/5 transition duration-150 group">
                                    <td className="px-6 py-5 font-medium text-gray-200">
                                        {task.description}
                                    </td>
                                    <td className="px-6 py-5 text-gray-400">
                                        <span className="bg-white/5 px-2 py-1 rounded-md text-xs border border-white/5">
                                            {task.category || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-400 font-mono text-xs">
                                        {format(new Date(task.date), 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border ${task.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                            task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                            }`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right space-x-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleExpand(task.id)} className="text-purple-400 hover:text-purple-300 font-medium transition hover:scale-105 inline-block">
                                            💬 {expandedTaskId === task.id ? 'Hide' : 'Comments'}
                                        </button>
                                        <button onClick={() => onEdit(task)} className="text-blue-400 hover:text-blue-300 font-medium transition hover:scale-105 inline-block">Edit</button>
                                        <button onClick={() => onDelete(task.id)} className="text-red-400 hover:text-red-300 font-medium transition hover:scale-105 inline-block">Delete</button>
                                    </td>
                                </tr>
                                {expandedTaskId === task.id && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 bg-black/20">
                                            <CommentSection taskId={task.id} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                    No tasks found. Click "New Task" to get started!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
