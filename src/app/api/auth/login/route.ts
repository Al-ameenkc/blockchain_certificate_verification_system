import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";
    const expectedPassword = process.env.ADMIN_LOGIN_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: "Server auth password is not configured." },
        { status: 500 }
      );
    }

    if (!password || password !== expectedPassword) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session_v2", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
