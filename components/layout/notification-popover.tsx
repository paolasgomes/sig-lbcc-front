"use client";

import Link from "next/link";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarcarNotificacaoComoLida,
  useNotificacoes,
} from "@/hooks/use-notificacoes";
import type { NotificacaoInterna } from "@/services/notificacoes-service";
import { formatDateOnly, getStatusPrazoLabel } from "@/lib/prazo-utils";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationItem({
  notificacao,
  onOpen,
  onMarkAsRead,
  isUpdating,
}: {
  notificacao: NotificacaoInterna;
  onOpen: (notificacao: NotificacaoInterna) => void;
  onMarkAsRead: (id: string) => void;
  isUpdating: boolean;
}) {
  const ordemNumero = notificacao.dados.ordem?.numero ?? "Ordem de fornecimento";

  return (
    <div className="space-y-3 border-b p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-5">{notificacao.titulo}</p>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              Não lida
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCreatedAt(notificacao.criadoEm)}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {notificacao.mensagem}
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="min-w-0">
          <span className="text-muted-foreground">Ordem</span>
          <p className="truncate font-medium" title={ordemNumero}>
            {ordemNumero}
          </p>
        </div>
        <div className="min-w-0">
          <span className="text-muted-foreground">Data limite</span>
          <p className="font-medium">{formatDateOnly(notificacao.dataLimite)}</p>
        </div>
        <div className="col-span-2 min-w-0">
          <span className="text-muted-foreground">Status</span>
          <p className="font-medium">{getStatusPrazoLabel(notificacao.statusPrazo)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {notificacao.link && (
          <Button
            asChild
            size="sm"
            variant="outline"
            onClick={() => onOpen(notificacao)}
          >
            <Link href={notificacao.link}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir ordem
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={isUpdating}
          onClick={() => onMarkAsRead(notificacao.id)}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          Marcar como lida
        </Button>
      </div>
    </div>
  );
}

export function NotificationPopover() {
  const router = useRouter();
  const { notificacoes, isLoading, error } = useNotificacoes({
    apenasNaoLidas: true,
  });
  const { marcarComoLida, isUpdating } = useMarcarNotificacaoComoLida();

  const handleOpen = (notificacao: NotificacaoInterna) => {
    if (!notificacao.lidaEm) {
      void marcarComoLida(notificacao.id);
    }
  };

  const handleMarkAsRead = (id: string) => {
    void marcarComoLida(id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notificações"
          aria-label={
            notificacoes.length > 0
              ? `${notificacoes.length} notificações não lidas`
              : "Notificações"
          }
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {notificacoes.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {notificacoes.length > 99 ? "99+" : notificacoes.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(25rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">
              {notificacoes.length === 0
                ? "Tudo em dia"
                : `${notificacoes.length} não lida${notificacoes.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            href="/notificacoes"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando notificações...
          </div>
        ) : error ? (
          <p className="px-4 py-8 text-center text-sm text-destructive">{error}</p>
        ) : notificacoes.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium">Nenhuma notificação não lida</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Novos alertas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="max-h-[min(32rem,calc(100vh-12rem))] overflow-y-auto">
            {notificacoes.map((notificacao) => (
              <NotificationItem
                key={notificacao.id}
                notificacao={notificacao}
                onOpen={handleOpen}
                onMarkAsRead={handleMarkAsRead}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}

        {notificacoes.length > 0 && (
          <div className="border-t bg-muted/30 px-4 py-2 text-center">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => router.push("/notificacoes")}
            >
              Acessar central de notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
