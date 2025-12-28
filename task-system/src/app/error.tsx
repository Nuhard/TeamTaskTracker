"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900 text-center p-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                Something went wrong!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                We encountered an unexpected error. Please try again or contact support if the issue persists.
            </p>
            <button
                onClick={() => reset()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium shadow-lg"
            >
                Try again
            </button>
        </div>
    );
}
