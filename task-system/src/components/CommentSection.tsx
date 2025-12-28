"use client";
import React, { useState, useEffect } from "react";
import { formatDistance } from "date-fns";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
}

interface Props {
    taskId: string;
}

export default function CommentSection({ taskId }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`);
            if (res.ok) {
                setComments(await res.json());
            }
        } catch (e) {
            console.error("Error fetching comments:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment })
            });

            if (res.ok) {
                const comment = await res.json();
                setComments([...comments, comment]);
                setNewComment("");
            }
        } catch (e) {
            alert("Error adding comment");
            console.error(e);
        }
    };

    return (
        <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">💬 Comments</h3>

            {/* Comment List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-semibold text-white text-sm">
                                            {comment.user.name || comment.user.email}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm break-words">{comment.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 rounded-lg p-2.5 text-sm"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium text-sm"
                    disabled={!newComment.trim()}
                >
                    Post
                </button>
            </form>
        </div>
    );
}
