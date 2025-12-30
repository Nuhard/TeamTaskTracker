import React, { useState, useEffect } from "react";

interface Props {
    task?: any;
    onClose: () => void;
    onSave: () => void;
}

export default function TaskForm({ task, onClose, onSave }: Props) {
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Axios");
    const [ticketNumber, setTicketNumber] = useState("");
    const [status, setStatus] = useState("PENDING");
    const [date, setDate] = useState("");
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [templateName, setTemplateName] = useState("");

    const CATEGORIES = ["Axios", "Whatsapp", "Other Task", "Releases", "Monitoring"];

    useEffect(() => {
        if (task) {
            setDescription(task.description || "");
            setCategory(task.category || "Axios");
            setTicketNumber(task.ticketNumber || "");
            setStatus(task.status);
            const d = new Date(task.date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setDate(d.toISOString().slice(0, 16));
        } else {
            const d = new Date();
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setDate(d.toISOString().slice(0, 16));
            setTicketNumber("");
        }
    }, [task]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch("/api/templates");
                if (res.ok) {
                    setTemplates(await res.json());
                }
            } catch (e) {
                console.error("Error fetching templates:", e);
            }
        };
        fetchTemplates();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { description, category, ticketNumber, status, date };

        const method = task ? "PUT" : "POST";
        const url = task ? `/api/tasks/${task.id}` : "/api/tasks";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error saving task: ${err.error || res.statusText}`);
                return;
            }

            onSave();
        } catch (e) {
            alert("Network error occurred");
            console.error(e);
        }
    };

    const handleLoadTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setDescription(template.description);
            setCategory(template.category || "Axios");
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!templateName.trim()) {
            alert("Please enter a template name");
            return;
        }

        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateName,
                    description,
                    category
                })
            });

            if (res.ok) {
                const newTemplate = await res.json();
                setTemplates([newTemplate, ...templates]);
                setTemplateName("");
                setShowSaveTemplate(false);
                alert("Template saved successfully!");
            }
        } catch (e) {
            alert("Error saving template");
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-50">
            <div className="glass-panel w-full max-w-md p-5 md:p-8 rounded-2xl border border-white/20 shadow-2xl max-h-[95vh] overflow-y-auto">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-white text-center pb-4 border-b border-white/10">{task ? "Edit Task" : "New Task"}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Description</label>
                        <textarea
                            className="w-full rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500/50 transition"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What do you need to do?"
                            required
                        />
                    </div>

                    {!task && templates.length > 0 && (
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-300">Load from Template</label>
                            <select
                                className="w-full rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500/50"
                                value={selectedTemplate}
                                onChange={(e) => {
                                    setSelectedTemplate(e.target.value);
                                    if (e.target.value) handleLoadTemplate(e.target.value);
                                }}
                            >
                                <option value="">-- Select Template --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id} className="bg-gray-800">{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-300">Category</label>
                            <select className="w-full rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/50" value={category} onChange={e => setCategory(e.target.value)}>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                                ))}
                            </select>
                        </div>
                        {category === "Axios" && (
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-300">Ticket #</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/50"
                                    value={ticketNumber}
                                    onChange={e => setTicketNumber(e.target.value)}
                                    placeholder="12345"
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Date & Time</label>
                        <input type="datetime-local" className="w-full rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/50" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Status</label>
                        <select className="w-full rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/50" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="PENDING" className="bg-gray-800">Pending</option>
                            <option value="IN_PROGRESS" className="bg-gray-800">In Progress</option>
                            <option value="COMPLETED" className="bg-gray-800">Completed</option>
                        </select>
                    </div>

                    <div className="flex justify-between gap-3 mt-8">
                        <div className="flex gap-2">
                            {!task && (
                                <button
                                    type="button"
                                    onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                                    className="px-4 py-2.5 bg-purple-600/20 text-purple-300 border border-purple-500/50 rounded-lg hover:bg-purple-600/30 transition font-medium text-sm"
                                >
                                    💾 Save as Template
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-medium">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-bold shadow-lg shadow-blue-500/25">
                                {task ? "Update Task" : "Create Task"}
                            </button>
                        </div>
                    </div>

                    {showSaveTemplate && (
                        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <label className="block mb-2 text-sm font-medium text-purple-300">Template Name</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 rounded-lg p-2.5 text-sm"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g., Daily Standup Task"
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveAsTemplate}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-medium text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
