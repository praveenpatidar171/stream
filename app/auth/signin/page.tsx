"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const params = useSearchParams();
	const registered = params.get("registered") === "1";

	const onCredentialsSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const res = await signIn("credentials", {
			email,
			password,
			redirect: true,
			callbackUrl: "/",
		});
		if (res?.error) {
			setError(res.error);
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md space-y-6">
				<h1 className="text-2xl font-bold text-center">Sign in</h1>
				{registered && (
					<p className="text-sm text-green-700 text-center">
						Account created. Please sign in.
					</p>
				)}

				<button
					onClick={() => signIn("google", { callbackUrl: "/" })}
					className="w-full rounded-md bg-red-500 hover:bg-red-600 text-white py-2 px-4"
				>
					Continue with Google
				</button>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="bg-transparent px-2 text-gray-500">Or continue with</span>
					</div>
				</div>

				<form onSubmit={onCredentialsSignIn} className="space-y-4">
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full border rounded-md px-3 py-2"
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border rounded-md px-3 py-2"
						required
					/>
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 disabled:opacity-50"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
					{error && <p className="text-sm text-red-600">{error}</p>}
				</form>

				<p className="text-sm text-center text-gray-600">
					New here?{" "}
					<Link href="/auth/register" className="text-blue-600 hover:underline">
						Create an account
					</Link>
				</p>
			</div>
		</main>
	);
}


