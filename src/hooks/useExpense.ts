import { useState } from "react";
import { graphqlRequest } from "../utils/graphql";
import {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "../types/expense";

export const useExpense = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with true for initial load
  const [total, setTotal] = useState(0);

  const fetchExpenses = async (
    page: number = 1,
    limit: number = 10,
    memberId?: string
  ) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;

      if (!memberId) {
        return { success: false, message: "Member ID is required" };
      }

      const query = `
        query GetExpenses($memberId: uuid!, $limit: Int!, $offset: Int!) {
          karlo_expenses(
            where: { member_id: { _eq: $memberId } }
            limit: $limit
            offset: $offset
            order_by: { created_at: desc }
          ) {
            id
            user_id
            member_id
            name
            details
            amount
            status
            attachments
            created_at
            updated_at
          }
          karlo_expenses_aggregate(where: { member_id: { _eq: $memberId } }) {
            aggregate {
              count
            }
          }
        }
      `;

      const result = await graphqlRequest(query, { memberId, limit, offset });

      if (result.data) {
        setExpenses(result.data.karlo_expenses || []);
        setTotal(result.data.karlo_expenses_aggregate?.aggregate?.count || 0);
        return { success: true, data: result.data.karlo_expenses };
      }

      return { success: false, message: "Failed to fetch expenses" };
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return {
        success: false,
        message: "An error occurred while fetching expenses",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const createExpense = async (input: CreateExpenseInput) => {
    try {
      const query = `
        mutation CreateExpense($input: karlo_expenses_insert_input!) {
          insert_karlo_expenses_one(object: $input) {
            id
            user_id
            member_id
            name
            details
            amount
            status
            attachments
            created_at
            updated_at
          }
        }
      `;

      const result = await graphqlRequest(query, { input });

      if (result.data?.insert_karlo_expenses_one) {
        const newExpense = result.data.insert_karlo_expenses_one;
        // Add the new expense to the beginning of the list for immediate display
        setExpenses((prev) => [newExpense, ...prev]);
        setTotal((prev) => prev + 1);
        return { success: true, data: newExpense };
      }

      return { success: false, message: "Failed to create expense" };
    } catch (error) {
      console.error("Error creating expense:", error);
      return {
        success: false,
        message: "An error occurred while creating expense",
      };
    }
  };

  const updateExpense = async (id: string, input: UpdateExpenseInput) => {
    try {
      const query = `
        mutation UpdateExpense($id: uuid!, $input: karlo_expenses_set_input!) {
          update_karlo_expenses_by_pk(
            pk_columns: { id: $id }
            _set: $input
          ) {
            id
            user_id
            member_id
            name
            details
            amount
            status
            attachments
            created_at
            updated_at
          }
        }
      `;

      const result = await graphqlRequest(query, { id, input });

      if (result.data?.update_karlo_expenses_by_pk) {
        const updatedExpense = result.data.update_karlo_expenses_by_pk;
        // Update the expense in the local state immediately
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === id ? updatedExpense : exp))
        );
        return { success: true, data: updatedExpense };
      }

      return { success: false, message: "Failed to update expense" };
    } catch (error) {
      console.error("Error updating expense:", error);
      return {
        success: false,
        message: "An error occurred while updating expense",
      };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const query = `
        mutation DeleteExpense($id: uuid!) {
          delete_karlo_expenses_by_pk(id: $id) {
            id
          }
        }
      `;

      const result = await graphqlRequest(query, { id });

      if (result.data?.delete_karlo_expenses_by_pk) {
        // Remove the expense from local state immediately
        setExpenses((prev) => prev.filter((exp) => exp.id !== id));
        setTotal((prev) => prev - 1);
        return { success: true };
      }

      return { success: false, message: "Failed to delete expense" };
    } catch (error) {
      console.error("Error deleting expense:", error);
      return {
        success: false,
        message: "An error occurred while deleting expense",
      };
    }
  };

  const approveExpense = async (id: string) => {
    try {
      const query = `
        mutation ApproveExpense($id: uuid!) {
          update_karlo_expenses_by_pk(
            pk_columns: { id: $id }
            _set: { status: "approved" }
          ) {
            id
            status
          }
        }
      `;

      const result = await graphqlRequest(query, { id });

      if (result.data?.update_karlo_expenses_by_pk) {
        // Update the expense status in local state immediately
        setExpenses((prev) =>
          prev.map((exp) =>
            exp.id === id ? { ...exp, status: "approved" } : exp
          )
        );
        return { success: true };
      }

      return { success: false, message: "Failed to approve expense" };
    } catch (error) {
      console.error("Error approving expense:", error);
      return {
        success: false,
        message: "An error occurred while approving expense",
      };
    }
  };

  const rejectExpense = async (id: string) => {
    try {
      const query = `
        mutation RejectExpense($id: uuid!) {
          update_karlo_expenses_by_pk(
            pk_columns: { id: $id }
            _set: { status: "rejected" }
          ) {
            id
            status
          }
        }
      `;

      const result = await graphqlRequest(query, { id });

      if (result.data?.update_karlo_expenses_by_pk) {
        // Update the expense status in local state immediately
        setExpenses((prev) =>
          prev.map((exp) =>
            exp.id === id ? { ...exp, status: "rejected" } : exp
          )
        );
        return { success: true };
      }

      return { success: false, message: "Failed to reject expense" };
    } catch (error) {
      console.error("Error rejecting expense:", error);
      return {
        success: false,
        message: "An error occurred while rejecting expense",
      };
    }
  };

  const fetchMemberExpenses = async (
    memberId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;

      const query = `
        query GetMemberExpenses($memberId: uuid!, $limit: Int!, $offset: Int!) {
          karlo_expenses(
            where: { member_id: { _eq: $memberId } }
            limit: $limit
            offset: $offset
            order_by: { created_at: desc }
          ) {
            id
            user_id
            member_id
            name
            details
            amount
            status
            attachments
            created_at
            updated_at
          }
          karlo_expenses_aggregate(where: { member_id: { _eq: $memberId } }) {
            aggregate {
              count
            }
          }
        }
      `;

      const result = await graphqlRequest(query, { memberId, limit, offset });

      if (result.data) {
        setExpenses(result.data.karlo_expenses || []);
        setTotal(result.data.karlo_expenses_aggregate?.aggregate?.count || 0);
        return { success: true, data: result.data.karlo_expenses };
      }

      return { success: false, message: "Failed to fetch member expenses" };
    } catch (error) {
      console.error("Error fetching member expenses:", error);
      return {
        success: false,
        message: "An error occurred while fetching member expenses",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllExpenses = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;

      const query = `
        query GetAllExpenses($limit: Int!, $offset: Int!) {
          karlo_expenses(
            limit: $limit
            offset: $offset
            order_by: { created_at: desc }
          ) {
            id
            user_id
            member_id
            name
            details
            amount
            status
            attachments
            created_at
            updated_at
          }
          karlo_expenses_aggregate {
            aggregate {
              count
            }
          }
        }
      `;

      const result = await graphqlRequest(query, { limit, offset });

      if (result.data) {
        setExpenses(result.data.karlo_expenses || []);
        setTotal(result.data.karlo_expenses_aggregate?.aggregate?.count || 0);
        return { success: true, data: result.data.karlo_expenses };
      }

      return { success: false, message: "Failed to fetch all expenses" };
    } catch (error) {
      console.error("Error fetching all expenses:", error);
      return {
        success: false,
        message: "An error occurred while fetching all expenses",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expenses,
    total,
    isLoading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    fetchMemberExpenses,
    fetchAllExpenses,
  };
};
