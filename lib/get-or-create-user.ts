import { db as prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function getOrCreateUser() {
  // Get Clerk user
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Not authenticated");
  }

  // Find or create user in database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    console.log("🆕 Creating new user for Clerk ID:", clerkUser.id);

    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
        name:
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.username ?? null,
      },
    });

    console.log("✅ User created:", user.id, user.email);
  }

  return user;
}
