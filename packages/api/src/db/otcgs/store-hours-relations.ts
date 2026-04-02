import { relations } from 'drizzle-orm/relations';
import { storeHours } from './store-hours-schema';

export const storeHoursRelations = relations(storeHours, () => ({
  // The organization table is managed by better-auth.
  // We link via organizationId but don't define the Drizzle relation
  // since the organization table isn't in our Drizzle schema exports.
}));
