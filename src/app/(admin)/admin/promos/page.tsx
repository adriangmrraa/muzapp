import { getPromos } from "./actions";
import { PromosTable } from "./promos-table";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const promos = await getPromos();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PromosTable promos={promos} />
    </div>
  );
}
