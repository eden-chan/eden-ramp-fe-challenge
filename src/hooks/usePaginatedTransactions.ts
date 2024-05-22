import { useCallback, useState } from "react";
import {
  PaginatedRequestParams,
  PaginatedResponse,
  Transaction,
} from "../utils/types";
import { PaginatedTransactionsResult } from "./types";
import { useCustomFetch } from "./useCustomFetch";

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch();
  const [paginatedTransactions, setPaginatedTransactions] =
    useState<PaginatedResponse<Transaction[]> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchAll = useCallback(async () => {
    const response = await fetchWithCache<
      PaginatedResponse<Transaction[]>,
      PaginatedRequestParams
    >("paginatedTransactions", {
      page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
    });

    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        setHasMore(false);
        return null;
      }

      const newTransactions = response.data;
      const updatedTransactions = previousResponse
        ? [...previousResponse.data, ...newTransactions]
        : newTransactions;

      setHasMore(response.nextPage !== null);

      return {
        data: updatedTransactions,
        nextPage: response.nextPage,
      };
    });
  }, [fetchWithCache, paginatedTransactions]);

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null);
    setHasMore(false);
  }, []);

  const setTransactions = useCallback((transactions: Transaction[]) => {
    setPaginatedTransactions((previousResponse) => {
      if (previousResponse === null) {
        return null;
      }

      return {
        data: transactions,
        nextPage: previousResponse.nextPage,
      };
    });
  }, []);

  return {
    data: paginatedTransactions,
    loading,
    hasMore,
    fetchAll,
    invalidateData,
    setTransactions,
  };
}
