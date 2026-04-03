// This resolver is no longer used. Bulk operations now target stock entries
// via bulkUpdateStock. This file is kept for backwards compatibility with
// any code that may still import it, but the GraphQL schema no longer
// defines a bulkUpdateInventory mutation.

export const bulkUpdateInventory = async () => {
  throw new Error('bulkUpdateInventory has been replaced by bulkUpdateStock');
};
