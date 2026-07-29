import { useState } from "react";
import EmptyState from "./EmptyState.jsx";
import TablePagination, { usePagination } from "./TablePagination.jsx";

export default function DataTable({ columns, rows, emptyTitle, emptyDescription, onRowClick, rowLabel }) {
  const [page, setPage] = useState(1);
  const pagination = usePagination(rows, page, setPage);

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="data-table-shell">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((row) => (
              <tr key={row.id} className={onRowClick ? "clickable-table-row" : undefined} tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined} onKeyDown={onRowClick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRowClick(row); } } : undefined} aria-label={onRowClick ? (rowLabel?.(row) || `View ${row.id}`) : undefined}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination {...pagination} onPageChange={setPage} />
    </div>
  );
}
