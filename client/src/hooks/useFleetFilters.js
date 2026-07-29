import { useMemo, useState } from "react";

const defaultFilters = { search: "", status: "", connection: "", risk: "" };

export default function useFleetFilters(vehicles) {
  const [filters, setFilters] = useState(defaultFilters);
  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    const searchValue = filters.search.trim().toLowerCase();
    const matchesSearch = !searchValue || [vehicle.id, vehicle.plateNumber, vehicle.driver]
      .some((value) => value.toLowerCase().includes(searchValue));
    return matchesSearch
      && (!filters.status || vehicle.status === filters.status)
      && (!filters.connection || vehicle.gpsStatus === filters.connection)
      && (!filters.risk || vehicle.riskLevel === filters.risk);
  }), [filters, vehicles]);

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const clearFilters = () => setFilters(defaultFilters);

  return { filters, filteredVehicles, updateFilter, clearFilters };
}
