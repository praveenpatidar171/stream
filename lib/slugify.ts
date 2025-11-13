import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export async function generateUniqueStreamSlug(title: string) {
	const baseSlug = slugify(title) || `stream-${nanoid()}`;
	let candidate = baseSlug;
	let attempt = 1;

	while (await prisma.stream.findUnique({ where: { slug: candidate } })) {
		candidate = `${baseSlug}-${attempt}`;
		attempt += 1;
	}

	return candidate;
}

export async function ensureUniqueStreamSlug(desired: string, currentId?: string) {
	const baseSlug = slugify(desired) || `stream-${nanoid()}`;
	let candidate = baseSlug;
	let attempt = 1;

	while (true) {
		const existing = await prisma.stream.findUnique({ where: { slug: candidate } });
		if (!existing || existing.id === currentId) {
			return candidate;
		}
		candidate = `${baseSlug}-${attempt}`;
		attempt += 1;
	}
}


