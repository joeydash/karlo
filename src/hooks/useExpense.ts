import { useState, useEffect } from "react";
import { graphqlRequest } from "../utils/graphql";
import {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "../types/expense";
import useAuthStore from "../stores/authStore";

export const useExpense = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
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
        return { success: true, data: result.data.insert_karlo_expenses_one };
      }

      return { success: false, message: "Failed to create expense" };
    } catch (error) {
      console.error("Error creating expense:", error);
      return {
        success: false,
        message: "An error occurred while creating expense",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpense = async (id: string, input: UpdateExpenseInput) => {
    setIsLoading(true);
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
        return { success: true, data: result.data.update_karlo_expenses_by_pk };
      }

      return { success: false, message: "Failed to update expense" };
    } catch (error) {
      console.error("Error updating expense:", error);
      return {
        success: false,
        message: "An error occurred while updating expense",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    setIsLoading(true);
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
        return { success: true };
      }

      return { success: false, message: "Failed to delete expense" };
    } catch (error) {
      console.error("Error deleting expense:", error);
      return {
        success: false,
        message: "An error occurred while deleting expense",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const approveExpense = async (id: string) => {
    setIsLoading(true);
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
        return { success: true };
      }

      return { success: false, message: "Failed to approve expense" };
    } catch (error) {
      console.error("Error approving expense:", error);
      return {
        success: false,
        message: "An error occurred while approving expense",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const rejectExpense = async (id: string) => {
    setIsLoading(true);
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
        return { success: true };
      }

      return { success: false, message: "Failed to reject expense" };
    } catch (error) {
      console.error("Error rejecting expense:", error);
      return {
        success: false,
        message: "An error occurred while rejecting expense",
      };
    } finally {
      setIsLoading(false);
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
