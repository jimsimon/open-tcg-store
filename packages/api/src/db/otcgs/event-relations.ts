import { relations } from 'drizzle-orm/relations';
import { event } from './event-schema';
import { eventRegistration } from './event-registration-schema';

export const eventRelations = relations(event, ({ many }) => ({
  registrations: many(eventRegistration),
}));

export const eventRegistrationRelations = relations(eventRegistration, ({ one }) => ({
  event: one(event, {
    fields: [eventRegistration.eventId],
    references: [event.id],
  }),
}));
