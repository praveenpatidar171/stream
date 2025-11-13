"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Stream {
	id: string;
	title: string;
	description: string | null;
	slug: string;
	isLive: boolean;
	visibility: string;
	createdAt: string;
	updatedAt: string;
}

export default function DashboardClient() {
	const [streams, setStreams] = useState<Stream[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	useEffect(() => {
		fetchStreams();
	}, []);

	const fetchStreams = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/api/streams?mine=true");
			setStreams(response.data.streams);
		} catch (err: any) {
			setError(err.response?.data?.error || "Failed to load streams");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (streamId: string) => {
		if (!confirm("Are you sure you want to delete this stream?")) return;

		try {
			await axios.delete(`/api/streams/${streamId}`);
			fetchStreams();
		} catch (err: any) {
			alert(err.response?.data?.error || "Failed to delete stream");
		}
	};

	const handleToggleLive = async (streamId: string, currentStatus: boolean) => {
		try {
			await axios.patch(`/api/streams/${streamId}`, {
				isLive: !currentStatus,
			});
			fetchStreams();
		} catch (err: any) {
			alert(err.response?.data?.error || "Failed to update stream");
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading your streams...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<Navbar />
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							My Streams
						</h1>
						<p className="mt-2 text-gray-600 dark:text-gray-400">
							Manage your live streams
						</p>
					</div>
					<button
						onClick={() => setShowCreateModal(true)}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
					>
						+ Create Stream
					</button>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				{streams.length === 0 ? (
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							You don't have any streams yet.
						</p>
						<button
							onClick={() => setShowCreateModal(true)}
							className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
						>
							Create Your First Stream
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{streams.map((stream) => (
							<div
								key={stream.id}
								className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
							>
								<div className="flex justify-between items-start mb-4">
									<div className="flex-1">
										<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
											{stream.title}
										</h3>
										<div className="flex items-center gap-2 mb-2">
											{stream.isLive ? (
												<span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
													LIVE
												</span>
											) : (
												<span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
													OFFLINE
												</span>
											)}
											<span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
												{stream.visibility}
											</span>
										</div>
									</div>
								</div>

								{stream.description && (
									<p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
										{stream.description}
									</p>
								)}

								<div className="flex gap-2 mt-4">
									<Link
										href={`/stream/${stream.slug}`}
										className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded text-sm font-medium transition-colors"
									>
										View
									</Link>
									<button
										onClick={() => handleToggleLive(stream.id, stream.isLive)}
										className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
											stream.isLive
												? "bg-red-600 hover:bg-red-700 text-white"
												: "bg-green-600 hover:bg-green-700 text-white"
										}`}
									>
										{stream.isLive ? "End Live" : "Go Live"}
									</button>
									<button
										onClick={() => handleDelete(stream.id)}
										className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				)}

				{showCreateModal && (
					<CreateStreamModal
						onClose={() => setShowCreateModal(false)}
						onSuccess={() => {
							setShowCreateModal(false);
							fetchStreams();
						}}
					/>
				)}
			</div>
		</div>
		</>
	);
}

interface CreateStreamModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

function CreateStreamModal({ onClose, onSuccess }: CreateStreamModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [visibility, setVisibility] = useState("public");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await axios.post("/api/streams", {
				title,
				description: description || undefined,
				visibility,
			});
			onSuccess();
		} catch (err: any) {
			setError(err.response?.data?.error || "Failed to create stream");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
				<h2 className="text-2xl text-center font-bold text-gray-900 dark:text-white mb-4">
					Create New Stream
				</h2>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Title *
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							minLength={3}
							maxLength={120}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							placeholder="Enter stream title"
						/>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={1000}
							rows={4}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							placeholder="Enter stream description (optional)"
						/>
					</div>

					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Visibility
						</label>
						<select
							value={visibility}
							onChange={(e) => setVisibility(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						>
							<option value="public">Public</option>
							<option value="unlisted">Unlisted</option>
							<option value="private">Private</option>
						</select>
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
						>
							{loading ? "Creating..." : "Create Stream"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

