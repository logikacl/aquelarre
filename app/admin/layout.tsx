import AdminNav from "@/components/AdminNav";

// Todo el panel lee precio/perfiles/usuarios frescos en cada carga (no cachear en build).
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // pt-32: el Nav global es fixed.
  return (
    <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <header className="mb-10 space-y-5">
        <h1 className="text-3xl font-headline font-bold">Panel</h1>
        <AdminNav />
      </header>
      {children}
    </main>
  );
}
