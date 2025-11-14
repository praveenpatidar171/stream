"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ExploreFiltersProps {
	initialSearch?: string;
	initialLiveOnly?: boolean;
	initialMine?: boolean;
	showMineToggle: boolean;
}

export default function ExploreFilters({
	initialSearch = "",
	initialLiveOnly = false,
	initialMine = false,
	showMineToggle,
}: ExploreFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [search, setSearch] = useState(initialSearch);
	const [liveOnly, setLiveOnly] = useState(initialLiveOnly);
	const [mineOnly, setMineOnly] = useState(initialMine);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setSearch(initialSearch);
		setLiveOnly(initialLiveOnly);
		setMineOnly(initialMine);
	}, [initialSearch, initialLiveOnly, initialMine]);

	const updateQuery = (nextSearch: string, nextLiveOnly: boolean, nextMineOnly: boolean) => {
		const params = new URLSearchParams(searchParams?.toString() ?? "");

		if (nextSearch.trim()) {
			params.set("q", nextSearch.trim());
		} else {
			params.delete("q");
		}

		if (nextLiveOnly) {
			params.set("live", "1");
		} else {
			params.delete("live");
		}

		if (showMineToggle && nextMineOnly) {
			params.set("mine", "1");
		} else {
			params.delete("mine");
		}

		const queryString = params.toString();
		const target = queryString ? `${pathname}?${queryString}` : pathname;

		startTransition(() => {
			router.push(target);
		});
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		updateQuery(search, liveOnly, mineOnly);
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
			<form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
				<div className="flex flex-col gap-4 md:flex-row md:items-center">
					<div className="flex-1">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Search streams
						</label>
						<div className="relative">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by title or description"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
					</div>

					<div className="flex flex-wrap gap-4">
						<label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
							<input
								type="checkbox"
								checked={liveOnly}
								onChange={(e) => {
									setLiveOnly(e.target.checked);
									updateQuery(search, e.target.checked, mineOnly);
								}}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							Live only
						</label>

						{showMineToggle && (
							<label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
								<input
									type="checkbox"
									checked={mineOnly}
									onChange={(e) => {
										setMineOnly(e.target.checked);
										updateQuery(search, liveOnly, e.target.checked);
									}}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								My streams
							</label>
						)}
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={() => {
							setSearch("");
							setLiveOnly(false);
							setMineOnly(false);
							updateQuery("", false, false);
						}}
						className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					>
						Reset
					</button>
					<button
						type="submit"
						disabled={isPending}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
					>
						{isPending ? "Searching..." : "Apply"}
					</button>
				</div>
			</form>
		</div>
	);
}


