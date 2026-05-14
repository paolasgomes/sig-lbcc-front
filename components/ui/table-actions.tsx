"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type TableActionsProps = {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  disabled?: boolean;
  trigger?: React.ReactNode;
};

export function TableActions({
  children,
  align = "end",
  trigger,
  disabled,
}: TableActionsProps) {
  return (
    <DropdownMenu>
      {trigger ? (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ações">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableActionLink({
  href,
  children,
  inset,
}: {
  href: string;
  children: React.ReactNode;
  inset?: boolean;
}) {
  return (
    <DropdownMenuItem asChild inset={inset}>
      <Link href={href}>{children}</Link>
    </DropdownMenuItem>
  );
}

export function TableActionButton({
  onSelect,
  children,
  variant = "default",
  inset,
  disabled = false,
  title,
}: {
  onSelect?: () => void;
  children: React.ReactNode;
  variant?: "default" | "destructive";
  inset?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <DropdownMenuItem
      disabled={disabled}
      title={title}
      onSelect={(e) => {
        e.preventDefault();
        if (onSelect) onSelect();
      }}
      data-variant={variant}
      inset={inset}
    >
      {children}
    </DropdownMenuItem>
  );
}

export default TableActions;
