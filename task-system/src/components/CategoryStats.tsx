import React from 'react';

interface Props {
    stats: Record<string, number>;
    title?: string;
}

export default function CategoryStats({ stats, title = "Task Breakdown" }: Props) {
    return (
        <div className="glass p-6 rounded-2xl mb-8">
            <h2 className="text-xl font-bold mb-6 text-gray-200 px-2 border-l-4 border-blue-500 pl-3">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {Object.entries(stats).map(([category, count]) => (
                    <div key={category} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition duration-300 text-center group">
                        <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">{count}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{category}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
