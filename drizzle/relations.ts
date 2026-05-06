import { relations } from "drizzle-orm/relations";
import { conversations, leads } from "./schema";

export const leadsRelations = relations(leads, ({one}) => ({
	conversation: one(conversations, {
		fields: [leads.conversationId],
		references: [conversations.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({many}) => ({
	leads: many(leads),
}));