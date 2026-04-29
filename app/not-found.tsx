"use client";

import { useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={() => router.push("/dashboard")}>
            Voltar ao Dashboard
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
