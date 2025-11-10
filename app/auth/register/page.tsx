"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function RegisterPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			await axios.post("/api/auth/register", { name, email, password });
			router.push("/auth/signin?registered=1");
		} catch (err: any) {
			const message =
				err?.response?.data?.error ||
				err?.message ||
				"Something went wrong.";
			setError(message);
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md space-y-6">
				<h1 className="text-2xl font-bold text-center">Create account</h1>
				<form onSubmit={onSubmit} className="space-y-4">
					<input
						type="text"
						placeholder="Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full border rounded-md px-3 py-2"
						required
					/>
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
						placeholder="Password (min 6 chars)"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border rounded-md px-3 py-2"
						required
						minLength={6}
					/>
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 disabled:opacity-50"
					>
						{loading ? "Creating..." : "Create account"}
					</button>
					{error && <p className="text-sm text-red-600">{error}</p>}
				</form>
				<p className="text-sm text-center text-gray-600">
					Already have an account?{" "}
					<Link href="/auth/signin" className="text-blue-600 hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</main>
	);
}


