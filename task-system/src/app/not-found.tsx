import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-100 p-4">
            <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                404
            </h2>
            <p className="text-xl mb-8">Page Not Found</p>
            <Link
                href="/dashboard"
                className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow hover:shadow-lg transition-all"
            >
                Return Home
            </Link>
        </div>
    );
}
