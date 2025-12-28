import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/30 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/30 blur-[120px] pointer-events-none"></div>

            <div className="glass p-12 rounded-2xl max-w-4xl w-full text-center relative z-10 flex flex-col items-center gap-8">
                <div className="space-y-4">
                    <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
                        Task Automation
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Streamline your daily workflow with our centralized task management system.
                    </p>
                </div>

                <div className="flex gap-6 mt-4">
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold backdrop-blur-sm transition-all transform hover:scale-105 shadow-lg"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
                    >
                        Go to Dashboard
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
                    <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 font-bold text-xl">🚀</div>
                        <h3 className="font-bold text-lg mb-2">Automated Tracking</h3>
                        <p className="text-sm text-gray-400">Review your daily tasks effortlessly with automated logging.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 font-bold text-xl">📊</div>
                        <h3 className="font-bold text-lg mb-2">Analytics</h3>
                        <p className="text-sm text-gray-400">Visual insights into your productivity and category breakdown.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4 text-pink-400 font-bold text-xl">🛡️</div>
                        <h3 className="font-bold text-lg mb-2">Secure access</h3>
                        <p className="text-sm text-gray-400">Role-based security ensures your data is safe and private.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
