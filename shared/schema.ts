import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  discordUsername: text("discord_username").notNull(),
  discordAvatar: text("discord_avatar"),
  role: text("role").notNull().default("user"), // user, captain, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  platform: text("platform").notNull(), // PC, Steam, Xbox, Gamepass
  imageUrl: text("image_url"),
  captainId: integer("captain_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true).notNull(),
  maxTeams: integer("max_teams").notNull(),
  currentPhase: text("current_phase").default("registration").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  bracketData: jsonb("bracket_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointsPerWin: integer("points_per_win").default(3).notNull(),
  pointsPerDraw: integer("points_per_draw").default(1).notNull(),
  pointsPerLoss: integer("points_per_loss").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournamentParticipants = pgTable("tournament_participants", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const leagueParticipants = pgTable("league_participants", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").references(() => leagues.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  points: integer("points").default(0).notNull(),
  matchesPlayed: integer("matches_played").default(0).notNull(),
  wins: integer("wins").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id),
  leagueId: integer("league_id").references(() => leagues.id),
  team1Id: integer("team1_id").references(() => teams.id).notNull(),
  team2Id: integer("team2_id").references(() => teams.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled, postponed
  winnerId: integer("winner_id").references(() => teams.id),
  isDraw: boolean("is_draw").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // team_invitation, match_scheduled, match_result, general
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional data for the notification
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const captainRequests = pgTable("captain_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reason: text("reason"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  teamMemberships: many(teamMembers),
  captainedTeams: many(teams),
  notifications: many(notifications),
  teamInvitations: many(teamInvitations),
  captainRequests: many(captainRequests),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  captain: one(users, { fields: [teams.captainId], references: [users.id] }),
  members: many(teamMembers),
  tournamentParticipations: many(tournamentParticipants),
  leagueParticipations: many(leagueParticipants),
  homeMatches: many(matches, { relationName: "team1" }),
  awayMatches: many(matches, { relationName: "team2" }),
  invitations: many(teamInvitations),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  participants: many(tournamentParticipants),
  matches: many(matches),
}));

export const leaguesRelations = relations(leagues, ({ many }) => ({
  participants: many(leagueParticipants),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  tournament: one(tournaments, { fields: [matches.tournamentId], references: [tournaments.id] }),
  league: one(leagues, { fields: [matches.leagueId], references: [leagues.id] }),
  team1: one(teams, { fields: [matches.team1Id], references: [teams.id], relationName: "team1" }),
  team2: one(teams, { fields: [matches.team2Id], references: [teams.id], relationName: "team2" }),
  winner: one(teams, { fields: [matches.winnerId], references: [teams.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  team: one(teams, { fields: [teamInvitations.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamInvitations.userId], references: [users.id] }),
  inviter: one(users, { fields: [teamInvitations.invitedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export const insertLeagueSchema = createInsertSchema(leagues).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertCaptainRequestSchema = createInsertSchema(captainRequests).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type League = typeof leagues.$inferSelect;
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;
export type CaptainRequest = typeof captainRequests.$inferSelect;
export type InsertCaptainRequest = z.infer<typeof insertCaptainRequestSchema>;
