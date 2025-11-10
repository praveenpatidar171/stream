import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const name = (body?.name ?? "").trim();
		const email = (body?.email ?? "").toLowerCase().trim();
		const password = body?.password ?? "";

		if (!name || !email || !password) {
			return NextResponse.json({ error: "All fields are required." }, { status: 400 });
		}
		// Very basic validation
		if (!/^\S+@\S+\.\S+$/.test(email)) {
		 return NextResponse.json({ error: "Invalid email." }, { status: 400 });
		}
		if (password.length < 6) {
			return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
		}

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json({ error: "Email already in use." }, { status: 409 });
		}

		const hashed = await hash(password, 10);
		await prisma.user.create({
			data: {
				name,
				email,
				password: hashed,
			},
		});

		return NextResponse.json({ success: true }, { status: 201 });
	} catch (err) {
		return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
	}
}


