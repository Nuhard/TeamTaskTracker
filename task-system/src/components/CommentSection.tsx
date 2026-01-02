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
    userId: string;
}

interface Props {
    taskId: string;
}

export default function CommentSection({ taskId }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string | null; role: string } | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        fetchUser();
        fetchComments();
    }, [taskId]);

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data);
            }
        } catch (e) {
            console.error("Error fetching user:", e);
        }
    };

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

    const startEditing = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditContent("");
    };

    const handleUpdateComment = async (commentId: string) => {
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent })
            });

            if (res.ok) {
                const updatedComment = await res.json();
                setComments(comments.map(c => c.id === commentId ? updatedComment : c));
                setEditingCommentId(null);
            } else {
                alert("Failed to update comment");
            }
        } catch (e) {
            console.error("Error updating comment:", e);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId));
            } else {
                alert("Failed to delete comment");
            }
        } catch (e) {
            console.error("Error deleting comment:", e);
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
                        <div key={comment.id} className="bg-white/5 rounded-lg p-3 border border-white/10 group">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold text-white text-sm">
                                                {comment.user.name || comment.user.email}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {currentUser && currentUser.id === comment.userId && !editingCommentId && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={() => startEditing(comment)}
                                                    className="text-xs text-blue-400 hover:text-blue-300"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingCommentId === comment.id ? (
                                        <div className="mt-2">
                                            <textarea
                                                className="w-full bg-black/20 text-white rounded p-2 text-sm border border-white/10 focus:border-blue-500 outline-none"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={2}
                                            />
                                            <div className="flex gap-2 mt-2 justify-end">
                                                <button
                                                    onClick={cancelEditing}
                                                    className="text-xs text-gray-400 hover:text-white"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateComment(comment.id)}
                                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-300 text-sm break-words">{comment.content}</p>
                                    )}
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
