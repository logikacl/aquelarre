"use server";
import { auth } from "@/lib/auth";
import { backendPost } from "@/lib/backend";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await auth();
  if (!(session as any)?.isAdmin) throw new Error("no autorizado");
}

export async function setPrice(priceClp: number) {
  await assertAdmin();
  await backendPost("/api/admin/config/set", { priceClp }, "admin");
  revalidatePath("/admin");
}

export async function upsertOracle(data: {
  slug: string; name: string; system: string;
  specialty?: string; bio?: string; photoUrl?: string; published: boolean; order: number;
}) {
  await assertAdmin();
  await backendPost("/api/admin/oracles/upsert", data, "admin");
  revalidatePath("/admin");
}

export async function deleteOracle(slug: string) {
  await assertAdmin();
  await backendPost("/api/admin/oracles/delete", { slug }, "admin");
  revalidatePath("/admin");
}
