import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateUniqueStreamSlug } from "@/lib/slugify";

const visibilityValues = ["public", "unlisted", "private"] as const;

const createStreamSchema = z.object({
	title: z.string().min(3, "Title must be at least 3 characters").max(120),
	description: z.string().max(1000).optional(),
	visibility: z.enum(visibilityValues).default("public"),
	hlsUrl: z.url("Must be a valid URL").optional(),
});

export async function GET(request: Request) {
	const session = await getServerSession(authOptions);
	const url = new URL(request.url);
	const search = url.searchParams.get("q") ?? undefined;
	const isLiveParam = url.searchParams.get("isLive");
	const mine = url.searchParams.get("mine") === "true";
	const visibilityFilters = url.searchParams
		.getAll("visibility")
		.filter((value): value is (typeof visibilityValues)[number] =>
			visibilityValues.includes(value as (typeof visibilityValues)[number]),
		);
	const takeParam = Number.parseInt(url.searchParams.get("take") ?? "", 10);
	const skipParam = Number.parseInt(url.searchParams.get("skip") ?? "", 10);

	const take = Number.isNaN(takeParam) ? 20 : Math.min(Math.max(takeParam, 1), 50);
	const skip = Number.isNaN(skipParam) ? 0 : Math.max(skipParam, 0);

	const andConditions: Prisma.StreamWhereInput[] = [];

	if (search) {
		andConditions.push({
			OR: [
				{ title: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (isLiveParam === "true") {
		andConditions.push({ isLive: true });
	} else if (isLiveParam === "false") {
		andConditions.push({ isLive: false });
	}

	if (visibilityFilters.length > 0) {
		andConditions.push({
			visibility: { in: visibilityFilters },
		});
	}

	const where: Prisma.StreamWhereInput = {};

	if (mine) {
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		andConditions.push({ userId: session.user.id });
	} else {
		const visibilityConditions: Prisma.StreamWhereInput[] = [{ visibility: "public" }];
		if (session?.user?.id) {
			visibilityConditions.push({ userId: session.user.id });
			visibilityConditions.push({ visibility: "unlisted" });
		}
		andConditions.push({ OR: visibilityConditions });
	}

	if (andConditions.length > 0) {
		where.AND = andConditions;
	}
	const streams = await prisma.stream.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		include: {
			user: {
				select: { id: true, name: true, image: true },
			},
		},
		take,
		skip,
	});

	return NextResponse.json({ streams });
}

export async function POST(request: Request) {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json();
	const parsed = createStreamSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid input", details: parsed.error.message },
			{ status: 400 },
		);
	}

	const { title, description, visibility, hlsUrl } = parsed.data;
	const slug = await generateUniqueStreamSlug(title);

	const stream = await prisma.stream.create({
		data: {
			title,
			description,
			visibility,
			hlsUrl,
			slug,
			userId: session.user.id,
		},
	});

	return NextResponse.json({ stream }, { status: 201 });
}


