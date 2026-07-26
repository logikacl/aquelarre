import { backendPost } from "@/lib/backend";
import UsersTable, { type UserRow } from "@/components/UsersTable";

export default async function Usuarios() {
  // Ya viene ordenado por fecha de alta descendente desde Convex.
  const users = await backendPost<UserRow[]>("/api/admin/users", {}, "admin");
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-headline font-bold">Usuarios</h2>
      <UsersTable rows={users} />
    </section>
  );
}
