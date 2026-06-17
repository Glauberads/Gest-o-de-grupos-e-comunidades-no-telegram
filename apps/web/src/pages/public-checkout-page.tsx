import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  { id: "monthly", name: "Mensal", price: "R$ 49,90", description: "Acesso renovado a cada 30 dias." },
  { id: "yearly", name: "Anual", price: "R$ 497,00", description: "Maior margem e melhor LTV." },
  { id: "lifetime", name: "Vitalicio", price: "R$ 997,00", description: "Oferta premium para comunidade evergreen." }
];

export function PublicCheckoutPage() {
  const { slug } = useParams();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-800 bg-slate-900 text-slate-50">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Comunidade publica</p>
          <h1 className="mt-4 text-4xl font-semibold">/{slug ?? "comunidade-demo"}</h1>
          <p className="mt-4 text-sm text-slate-300">
            Checkout pronto para Pix via Asaas, validacao de lead e liberacao automatica no Telegram.
          </p>
        </Card>

        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-slate-900">{plan.price}</div>
                  <Button className="mt-3">Gerar Pix</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

