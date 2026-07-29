export default function TripFilters({ filters, onChange, onClear, vehicles, drivers }) {
  const field=(label,name,options)=><label className="trip-filter"><span>{label}</span><select className="input select" value={filters[name]} onChange={(e)=>onChange(name,e.target.value)}><option value="">All</option>{options.map((v)=><option key={v} value={v}>{v}</option>)}</select></label>;
  return <div className="trip-filters">
    <label className="trip-filter trip-search"><span>Search</span><input className="input" placeholder="Trip, vehicle, driver, or route" value={filters.search} onChange={(e)=>onChange("search",e.target.value)} /></label>
    <label className="trip-filter"><span>Date</span><input type="date" className="input" value={filters.date} onChange={(e)=>onChange("date",e.target.value)} /></label>
    {field("Vehicle","vehicle",vehicles)}{field("Driver","driver",drivers)}{field("Route Status","routeStatus",["Planned","On Route","Deviation","Completed","Cancelled"])}
    <button type="button" className="button ghost" onClick={onClear}>Clear Filters</button>
  </div>;
}
