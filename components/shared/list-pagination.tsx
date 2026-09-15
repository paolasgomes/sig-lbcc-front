"use client";

import { getPaginationItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ListPaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function ListPagination({
  page,
  pageCount,
  onPageChange,
  className,
}: ListPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const items = getPaginationItems(page, pageCount);
  const isFirstPage = page <= 1;
  const isLastPage = page >= pageCount;

  return (
    <Pagination className={cn("overflow-x-auto", className)}>
      <PaginationContent className="flex-nowrap justify-center">
        <PaginationItem>
          <PaginationPrevious
            onClick={() => {
              if (!isFirstPage) {
                onPageChange(page - 1);
              }
            }}
            aria-disabled={isFirstPage}
            tabIndex={isFirstPage ? -1 : undefined}
            className={cn(isFirstPage && "pointer-events-none opacity-50")}
          />
        </PaginationItem>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === page}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => {
              if (!isLastPage) {
                onPageChange(page + 1);
              }
            }}
            aria-disabled={isLastPage}
            tabIndex={isLastPage ? -1 : undefined}
            className={cn(isLastPage && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
