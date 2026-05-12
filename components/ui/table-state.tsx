"use client";

import * as React from "react";
import { Spinner } from "./spinner";
import { Empty } from "./empty";

export function TableLoading({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 py-12 text-muted-foreground">
      <Spinner className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
}

export function TableNoData({
  title,
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return <Empty title={title} description={description} className={className} />;
}

export function TableError({
  title,
  description,
}: {
  title?: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="text-destructive font-semibold">{title ?? "Erro"}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  );
}

export default TableLoading;
