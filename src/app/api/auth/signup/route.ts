import { signUp } from "@/lib/auth";
import { z } from "zod";

const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SignUpSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await signUp(result.data.email, result.data.password, result.data.name);

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sign-up failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
