import React from 'react';

interface Props {
    stats: Record<string, number>;
    title?: string;
}

export default function CategoryStats({ stats, title = "Task Breakdown" }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2 md:gap-4 px-2 py-3 bg-white/5 rounded-xl border border-white/10 mb-6 overflow-x-auto scrollbar-hide">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-r border-white/10 pr-4 mr-2 hidden sm:block">
                {title}
            </div>
            <div className="flex gap-3 md:gap-6 flex-1 justify-around sm:justify-start">
                {Object.entries(stats).map(([category, count]) => (
                    <div key={category} className="flex items-center gap-2 md:gap-3 group">
                        <div className="text-lg md:text-xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{count}</div>
                        <div className="text-[8px] md:text-[9px] text-gray-400 uppercase tracking-widest font-bold border-b border-transparent group-hover:border-blue-500/50 transition-all">{category}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
