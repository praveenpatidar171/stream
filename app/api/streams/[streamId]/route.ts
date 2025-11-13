import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureUniqueStreamSlug } from "@/lib/slugify";

const visibilityValues = ["public", "unlisted", "private"] as const;

const updateStreamSchema = z
	.object({
		title: z.string().min(3).max(120).optional(),
		description: z.string().max(1000).nullable().optional(),
		visibility: z.enum(visibilityValues).optional(),
		slug: z.string().min(3).max(160).optional(),
		isLive: z.boolean().optional(),
		hlsUrl: z.string().url("Must be a valid URL").nullable().optional(),
	})
	.refine(
		(data) =>
			data.title !== undefined ||
			data.description !== undefined ||
			data.visibility !== undefined ||
			data.slug !== undefined ||
			data.isLive !== undefined ||
			data.hlsUrl !== undefined,
		{ message: "No fields provided for update" },
	);

async function findStream(streamId: string) {
	const byId = await prisma.stream.findUnique({
		where: { id: streamId },
		include: {
			user: { select: { id: true, name: true, image: true } },
		},
	});
	if (byId) {
		return byId;
	}
	return prisma.stream.findUnique({
		where: { slug: streamId },
		include: {
			user: { select: { id: true, name: true, image: true } },
		},
	});
}

function canViewStream(stream: Awaited<ReturnType<typeof findStream>>, userId?: string | null) {
	if (!stream) return false;
	if (stream.visibility === "private" && stream.userId !== userId) {
		return false;
	}
	return true;
}

export async function GET(
	request: Request,
	{ params }: { params: { streamId: string } },
) {
	const session = await getServerSession(authOptions);
	const stream = await findStream(params.streamId);

	if (!stream || !canViewStream(stream, session?.user?.id)) {
		return NextResponse.json({ error: "Stream not found" }, { status: 404 });
	}

	return NextResponse.json({ stream });
}

export async function PATCH(
	request: Request,
	{ params }: { params: { streamId: string } },
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const existing = await findStream(params.streamId);

	if (!existing) {
		return NextResponse.json({ error: "Stream not found" }, { status: 404 });
	}

	if (existing.userId !== session.user.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = await request.json();
	const parsed = updateStreamSchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid input", details: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const { title, description, visibility, slug, isLive, hlsUrl } = parsed.data;
	const updateData: Record<string, unknown> = {};

	if (title !== undefined) updateData.title = title;
	if (description !== undefined) updateData.description = description;
	if (visibility !== undefined) updateData.visibility = visibility;
	if (hlsUrl !== undefined) updateData.hlsUrl = hlsUrl;
	if (isLive !== undefined) updateData.isLive = isLive;

	if (slug !== undefined) {
		updateData.slug = await ensureUniqueStreamSlug(slug, existing.id);
	}

	const stream = await prisma.stream.update({
		where: { id: existing.id },
		data: updateData,
	});

	return NextResponse.json({ stream });
}

export async function DELETE(
	request: Request,
	{ params }: { params: { streamId: string } },
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const existing = await findStream(params.streamId);

	if (!existing) {
		return NextResponse.json({ error: "Stream not found" }, { status: 404 });
	}

	if (existing.userId !== session.user.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	await prisma.stream.delete({ where: { id: existing.id } });

	return NextResponse.json({ success: true });
}


