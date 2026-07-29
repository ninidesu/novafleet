import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DataTable from "../components/DataTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function TablePage({ eyebrow, title, description, searchPlaceholder, rows, columns, filterKeys, loading = false, error = "", onRetry, actions, onRowClick, rowLabel, emptyTitle = "No matching records", emptyDescription = "Clear the search field or add a new record." }) {
  const [query, setQuery] = useState("");
  const { globalSearch = "" } = useOutletContext() || {};
  const filteredRows = useMemo(() => {
    const term = (globalSearch || query).trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => filterKeys.some((key) => String(row[key] || "").toLowerCase().includes(term)));
  }, [filterKeys, globalSearch, query, rows]);

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      <Card>
        {loading ? <LoadingState title={`Loading ${title.toLowerCase()}`} description="Retrieving current records from Supabase." /> : error ? (
          <div className="resource-error" role="alert"><EmptyState title={`Unable to load ${title.toLowerCase()}`} description={error} />{onRetry && <Button onClick={onRetry}>Try again</Button>}</div>
        ) : <>
          <div className="table-toolbar">
            <Input id={`${title.toLowerCase().replaceAll(" ", "-")}-search`} placeholder={searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`Search ${title}`} />
            <div className="table-record-count">{filteredRows.length} records</div>
          </div>
          <DataTable columns={columns} rows={filteredRows} emptyTitle={emptyTitle} emptyDescription={emptyDescription} onRowClick={onRowClick} rowLabel={rowLabel} />
        </>}
      </Card>
    </div>
  );
}
