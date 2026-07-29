import { useCallback, useEffect, useState } from "react";

export default function useFleetResource(loader) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (loadError) {
      setError(loadError.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}