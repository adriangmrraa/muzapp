import { fetchClients } from "./actions";
import { ClientsView } from "./clients-view";

export const metadata = {
  title: "Clientes — Mrs Muzzarella Admin",
};

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;

  const data = await fetchClients({
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Clientes
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos los clientes unificados: pedidos, conversaciones y leads
        </p>
      </div>

      <ClientsView
        clients={data.clients}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        currentSearch={params.search ?? ""}
      />
    </div>
  );
}
