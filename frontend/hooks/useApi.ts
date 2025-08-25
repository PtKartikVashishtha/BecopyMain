import { useState } from 'react';

export function useApi<T, E = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async (promise: Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await promise;
      setData(result);
      return result;
    } catch (error: any) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    error,
    loading,
    execute,
  };
} 