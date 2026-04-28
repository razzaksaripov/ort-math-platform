import { useState, useEffect } from "react";
import api from "../services/api";

export default function useTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/topics/")
      .then((res) => setTopics(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { topics, loading, error };
}
