import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee, Transaction } from "./utils/types";

export function App() {
  const {
    data: employees,
    loading: loadingEmployees,
    ...employeeUtils
  } = useEmployees();
  const {
    data: paginatedTransactions,
    loading: loadingTransactions,
    hasMore,
    fetchAll: fetchAllTransactions,
    invalidateData: invalidatePaginatedTransactions,
    setTransactions: setPaginatedTransactions,
  } = usePaginatedTransactions();
  const {
    data: transactionsByEmployee,
    loading: loadingTransactionsByEmployee,
    fetchById: fetchTransactionsByEmployee,
    invalidateData: invalidateTransactionsByEmployee,
    setTransactions: setTransactionsByEmployee,
  } = useTransactionsByEmployee();

  const [isLoading, setIsLoading] = useState(false);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    invalidateTransactionsByEmployee();
    await employeeUtils.fetchAll();
    await fetchAllTransactions();
    setIsLoading(false);
  }, [employeeUtils, fetchAllTransactions, invalidateTransactionsByEmployee]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      invalidatePaginatedTransactions();
      await fetchTransactionsByEmployee(employeeId);
    },
    [fetchTransactionsByEmployee, invalidatePaginatedTransactions]
  );

  const approveTransaction = useCallback(
    (transactionId: string) => {
      const updatedTransactions = transactions?.map((transaction) => {
        if (transaction.id === transactionId) {
          return {
            ...transaction,
            approved: !transaction.approved,
          };
        }
        return transaction;
      });

      setPaginatedTransactions(updatedTransactions as Transaction[]);
      setTransactionsByEmployee(updatedTransactions as Transaction[]);
    },
    [transactions, setPaginatedTransactions, setTransactionsByEmployee]
  );

  useEffect(() => {
    if (employees === null && !loadingEmployees) {
      loadAllTransactions();
    }
  }, [loadingEmployees, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />
        <hr className="RampBreak--l" />
        <InputSelect<Employee>
          isLoading={loadingEmployees}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return;
            }
            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions();
            } else {
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
        />
        <div className="RampBreak--l" />
        <div className="RampGrid">
          <Transactions
            transactions={transactions}
            onApprove={approveTransaction}
          />
          {paginatedTransactions !== null && hasMore && (
            <button
              className="RampButton"
              disabled={loadingTransactions}
              onClick={fetchAllTransactions}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
