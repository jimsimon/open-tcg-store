// This resolver is no longer used. Bulk operations now target stock entries
// via bulkDeleteStock. This file is kept for backwards compatibility with
// any code that may still import it, but the GraphQL schema no longer
// defines a bulkDeleteInventory mutation.

export const bulkDeleteInventory = async () => {
  throw new Error('bulkDeleteInventory has been replaced by bulkDeleteStock');
};
