import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import Link from "next/link";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ExploreFilters from "./ExploreFilters";

const visibilityValues = ["public", "unlisted", "private"] as const;

interface StreamsPageProps {
	searchParams?: Record<string, string | string[] | undefined>;
}

export default async function StreamsPage({ searchParams }: StreamsPageProps) {
	const session = await getServerSession(authOptions);

	const qParam = getSingleParam(searchParams?.q);
	const liveParam = getSingleParam(searchParams?.live);
	const mineParam = getSingleParam(searchParams?.mine);
	const visibilityParams = toArray(searchParams?.visibility).filter((value): value is (typeof visibilityValues)[number] =>
		visibilityValues.includes(value as (typeof visibilityValues)[number]),
	);

	const searchTerm = qParam?.trim() ?? "";
	const liveOnly = liveParam === "1" || liveParam === "true";
	const mineOnly = session?.user?.id ? mineParam === "1" || mineParam === "true" : false;

	const where = buildWhereClause({
		search: searchTerm,
		liveOnly,
		mineOnly,
		userId: session?.user?.id,
		visibilityFilters: visibilityParams,
	});

	const streams = await prisma.stream.findMany({
		where,
		orderBy: [
			{ isLive: "desc" },
			{ updatedAt: "desc" },
		],
		include: {
			user: {
				select: {
					id: true,
					name: true,
					image: true,
				},
			},
		},
	});

	const liveStreams = streams.filter((stream) => stream.isLive);
	const offlineStreams = streams.filter((stream) => !stream.isLive);

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mb-6">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Discover Streams</h1>
						<p className="text-gray-600 dark:text-gray-400 max-w-2xl">
							Browse live streams from the community. Use the filters to find active streams or search by topic.
						</p>
					</div>

					<ExploreFilters
						initialSearch={searchTerm}
						initialLiveOnly={liveOnly}
						initialMine={mineOnly}
						showMineToggle={Boolean(session?.user?.id)}
					/>

					{streams.length === 0 ? (
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No streams found</h2>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								Try adjusting your filters or check back later to see who&apos;s live.
							</p>
							<Link
								href="/dashboard"
								className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
							>
								Create your own stream
							</Link>
						</div>
					) : (
						<div className="space-y-10">
							{liveStreams.length > 0 && (
								<section>
									<header className="flex items-center justify-between mb-4">
										<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Live now</h2>
										<span className="text-sm text-gray-500 dark:text-gray-400">
											{liveStreams.length} {liveStreams.length === 1 ? "stream" : "streams"} live
										</span>
									</header>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
										{liveStreams.map((stream) => (
											<StreamCard key={stream.id} stream={stream} />
										))}
									</div>
								</section>
							)}

							{offlineStreams.length > 0 && (
								<section>
									<header className="flex items-center justify-between mb-4">
										<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All streams</h2>
										<span className="text-sm text-gray-500 dark:text-gray-400">
											{offlineStreams.length} {offlineStreams.length === 1 ? "stream" : "streams"} available
										</span>
									</header>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
										{offlineStreams.map((stream) => (
											<StreamCard key={stream.id} stream={stream} />
										))}
									</div>
								</section>
							)}
						</div>
					)}
				</div>
			</main>
		</>
	);
}

function getSingleParam(param: string | string[] | undefined): string | undefined {
	if (!param) return undefined;
	return Array.isArray(param) ? param[0] : param;
}

function toArray(param: string | string[] | undefined): string[] {
	if (!param) return [];
	return Array.isArray(param) ? param : [param];
}

interface BuildWhereClauseParams {
	search?: string;
	liveOnly?: boolean;
	mineOnly?: boolean;
	userId?: string;
	visibilityFilters?: string[];
}

function buildWhereClause({
	search,
	liveOnly,
	mineOnly,
	userId,
	visibilityFilters = [],
}: BuildWhereClauseParams): Prisma.StreamWhereInput {
	const andConditions: Prisma.StreamWhereInput[] = [];

	if (search) {
		andConditions.push({
			OR: [
				{ title: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (liveOnly) {
		andConditions.push({ isLive: true });
	}

	if (visibilityFilters.length > 0) {
		andConditions.push({ visibility: { in: visibilityFilters as (typeof visibilityValues)[number][] } });
	}

	if (mineOnly) {
		if (userId) {
			andConditions.push({ userId });
		}
	} else {
		const visibilityConditions: Prisma.StreamWhereInput[] = [{ visibility: "public" }];
		if (userId) {
			visibilityConditions.push({ visibility: "unlisted" });
			visibilityConditions.push({ userId });
		}
		andConditions.push({ OR: visibilityConditions });
	}

	return andConditions.length > 0 ? { AND: andConditions } : {};
}

type StreamWithOwner = Prisma.StreamGetPayload<{
	include: {
		user: {
			select: {
				id: true;
				name: true;
				image: true;
			};
		};
	};
}>;

interface StreamCardProps {
	stream: StreamWithOwner;
}

function StreamCard({ stream }: StreamCardProps) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
			<div className="p-6 flex flex-col h-full">
				<div className="flex items-start justify-between gap-3 mb-4">
					<div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{stream.title}</h3>
						<div className="flex items-center gap-2 mt-2">
							<span
								className={`text-xs font-semibold px-2 py-1 rounded-full ${
									stream.isLive
										? "bg-red-500 text-white"
										: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
								}`}
							>
								{stream.isLive ? "LIVE" : "OFFLINE"}
							</span>
							<span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{stream.visibility}</span>
						</div>
					</div>
				</div>

				{stream.description && (
					<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{stream.description}</p>
				)}

				<div className="mt-auto flex items-center justify-between">
					<div className="text-sm text-gray-500 dark:text-gray-400">
						{stream.user?.name ? `by ${stream.user.name}` : "Anonymous"}
					</div>
					<Link
						href={`/stream/${stream.slug}`}
						className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
					>
						View stream
					</Link>
				</div>
			</div>
		</div>
	);
}


