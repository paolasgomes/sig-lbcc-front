export type PaginationItem = number | "ellipsis";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getPaginationItems(
  currentPage: number,
  pageCount: number,
  siblingCount = 1,
): PaginationItem[] {
  if (pageCount <= 0) {
    return [];
  }

  const page = Math.min(Math.max(currentPage, 1), pageCount);
  const totalNumbers = siblingCount * 2 + 5;

  if (pageCount <= totalNumbers) {
    return range(1, pageCount);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, pageCount);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < pageCount - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(1, leftItemCount), "ellipsis", pageCount];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [1, "ellipsis", ...range(pageCount - rightItemCount + 1, pageCount)];
  }

  return [
    1,
    "ellipsis",
    ...range(leftSibling, rightSibling),
    "ellipsis",
    pageCount,
  ];
}
