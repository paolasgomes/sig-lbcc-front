"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Truck,
  Package,
  FileText,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";
import {
  ROLES_ATENDIMENTOS_E_COTACOES,
  ROLES_GESTAO_COMPLETA,
  PERFIS_DASHBOARD_PACIENTES,
  PERFIS_GESTAO_BASE,
  usuarioTemAcessoAoModulo,
} from "@/lib/access-control";
import Image from "next/image";
import Logo from "@/public/lbcc-logo.svg";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  perfilMinimo?: PerfilUsuario[];
  allowedRoles?: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    perfilMinimo: PERFIS_DASHBOARD_PACIENTES,
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
    perfilMinimo: PERFIS_DASHBOARD_PACIENTES,
  },
  {
    label: "Atendimentos",
    href: "/atendimentos",
    icon: ClipboardList,
    allowedRoles: ROLES_ATENDIMENTOS_E_COTACOES,
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: Users,
    perfilMinimo: PERFIS_GESTAO_BASE,
  },
  {
    label: "Cotações",
    href: "/cotacoes",
    icon: FileText,
    allowedRoles: ROLES_ATENDIMENTOS_E_COTACOES,
  },
  {
    label: "Áreas",
    href: "/areas",
    icon: MapPin,
    perfilMinimo: PERFIS_GESTAO_BASE,
  },
  {
    label: "Fornecedores",
    href: "/fornecedores",
    icon: Truck,
    allowedRoles: ROLES_GESTAO_COMPLETA,
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: Package,
    perfilMinimo: PERFIS_GESTAO_BASE,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    allowedRoles: ROLES_GESTAO_COMPLETA,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { usuario } = useAuth();

  const filteredItems = navItems.filter((item) =>
    usuarioTemAcessoAoModulo(usuario, {
      perfisPermitidos: item.perfilMinimo,
      allowedRoles: item.allowedRoles,
    }),
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 ">
        <div className="flex items-center justify-center rounded-xl mx-auto">
          <Image src={Logo} alt="Logo LBCC" width={108} height={108} loading="eager" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="text-xs text-sidebar-foreground/70">Bataguassu - MS</p>
          <p className="text-xs text-sidebar-foreground/50">Versão 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
