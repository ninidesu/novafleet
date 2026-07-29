import { useEffect } from "react";

const PAGE_SIZE = 10;

function visiblePages(currentPage, totalPages) {
  const visibleCount = Math.min(5, totalPages);
  let start = Math.max(1, currentPage - Math.floor(visibleCount / 2));
  start = Math.min(start, totalPages - visibleCount + 1);
  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export function usePagination(items, page, setPage) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, setPage, totalPages]);

  return {
    page: safePage,
    totalPages,
    pageItems: items.slice(startIndex, endIndex),
    start: totalItems ? startIndex + 1 : 0,
    end: endIndex,
    totalItems,
  };
}

export default function TablePagination({ page, totalPages, start, end, totalItems, onPageChange }) {
  if (!totalItems) return null;

  const changePage = (nextPage) => {
    onPageChange(Math.min(totalPages, Math.max(1, nextPage)));
  };

  return (
    <footer className="table-pagination" aria-label="Table pagination">
      <p>Showing <strong>{start}–{end}</strong> out of <strong>{totalItems}</strong></p>
      <nav className="table-pagination-controls" aria-label="Pagination pages">
        <button type="button" onClick={() => changePage(page - 1)} disabled={page === 1} aria-label="Previous page">&lt;</button>
        <button type="button" onClick={() => changePage(1)} disabled={page === 1} aria-label="First page">&lt;&lt;</button>
        {visiblePages(page, totalPages).map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            className={pageNumber === page ? "active" : ""}
            onClick={() => changePage(pageNumber)}
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </button>
        ))}
        <button type="button" onClick={() => changePage(page + 1)} disabled={page === totalPages} aria-label="Next page">&gt;</button>
        <button type="button" onClick={() => changePage(totalPages)} disabled={page === totalPages} aria-label="Last page">&gt;&gt;</button>
      </nav>
    </footer>
  );
}
