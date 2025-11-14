"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
	const { data: session } = useSession();

	return (
		<nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<Link href="/" className="text-xl font-bold text-blue-600">
						Stream
					</Link>

					<div className="flex items-center gap-4">
						<Link
							href="/streams"
							className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
						>
							Streams
						</Link>

						{session ? (
							<>
								<Link
									href="/dashboard"
									className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
								>
									Dashboard
								</Link>
								<span className="text-gray-500 dark:text-gray-400">
									{session.user?.name || session.user?.email}
								</span>
								<button
									onClick={() => signOut({ callbackUrl: "/" })}
									className="text-gray-700 dark:text-gray-300 hover:text-red-600 transition-colors"
								>
									Sign Out
								</button>
							</>
						) : (
							<Link
								href="/auth/signin"
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
							>
								Sign In
							</Link>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}

