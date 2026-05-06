import { fetchOrders, getOrderCounts } from "./actions";
import { OrdersView } from "./orders-view";

export const metadata = {
  title: "Pedidos / Cocina — Mrs Muzzarella Admin",
};

interface Props {
  searchParams: Promise<{
    status?: string;
    type?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams;

  const [data, counts] = await Promise.all([
    fetchOrders({
      status: params.status,
      type: params.type,
      search: params.search,
      page: params.page ? parseInt(params.page) : 1,
    }),
    getOrderCounts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gold-gradient">
          Pedidos / Cocina
        </h1>
        <p className="text-sm text-muted-foreground">
          Pedidos registrados por el agente de WhatsApp
        </p>
      </div>

      <OrdersView
        orders={data.rows}
        counts={counts}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        currentStatus={params.status ?? ""}
        currentType={params.type ?? ""}
        currentSearch={params.search ?? ""}
      />
    </div>
  );
}
