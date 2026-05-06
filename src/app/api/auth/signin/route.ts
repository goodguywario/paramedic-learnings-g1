import { signIn } from "@/lib/auth";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SignInSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await signIn(result.data.email, result.data.password);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sign-in failed";
    return Response.json({ error: message }, { status: 401 });
  }
}
