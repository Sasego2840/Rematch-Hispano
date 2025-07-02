import { 
  users, teams, teamMembers, tournaments, leagues, matches, 
  notifications, teamInvitations, captainRequests,
  tournamentParticipants, leagueParticipants,
  type User, type InsertUser, type Team, type InsertTeam,
  type Tournament, type InsertTournament, type League, type InsertLeague,
  type Match, type InsertMatch, type Notification, type InsertNotification,
  type TeamInvitation, type InsertTeamInvitation,
  type CaptainRequest, type InsertCaptainRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<void>;

  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByUser(userId: number): Promise<Team[]>;
  getTeamMembers(teamId: number): Promise<User[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<InsertTeam>): Promise<void>;
  deleteTeam(id: number): Promise<void>;
  addTeamMember(teamId: number, userId: number): Promise<void>;
  removeTeamMember(teamId: number, userId: number): Promise<void>;
  getAllTeams(): Promise<Team[]>;

  // Tournaments
  getTournament(id: number): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  getTournamentsByTeam(teamId: number): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, updates: Partial<InsertTournament>): Promise<void>;
  addTournamentParticipant(tournamentId: number, teamId: number): Promise<void>;

  // Leagues
  getLeague(id: number): Promise<League | undefined>;
  getAllLeagues(): Promise<League[]>;
  getLeaguesByTeam(teamId: number): Promise<League[]>;
  createLeague(league: InsertLeague): Promise<League>;
  updateLeague(id: number, updates: Partial<InsertLeague>): Promise<void>;
  addLeagueParticipant(leagueId: number, teamId: number): Promise<void>;
  getLeagueStandings(leagueId: number): Promise<any[]>;
  updateLeaguePoints(leagueId: number, teamId: number, points: number, wins: number, draws: number, losses: number): Promise<void>;

  // Matches
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByTeam(teamId: number): Promise<Match[]>;
  getUpcomingMatches(limit?: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<InsertMatch>): Promise<void>;
  getMatchesInDateRange(startDate: Date, endDate: Date): Promise<Match[]>;

  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // Team Invitations
  getTeamInvitation(id: number): Promise<TeamInvitation | undefined>;
  getInvitationsByUser(userId: number): Promise<TeamInvitation[]>;
  createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation>;
  updateInvitationStatus(id: number, status: string): Promise<void>;

  // Captain Requests
  getCaptainRequests(): Promise<CaptainRequest[]>;
  createCaptainRequest(request: InsertCaptainRequest): Promise<CaptainRequest>;
  updateCaptainRequestStatus(id: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getTeamsByUser(userId: number): Promise<Team[]> {
    const result = await db
      .select({ team: teams })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, userId));
    return result.map(r => r.team);
  }

  async getTeamMembers(teamId: number): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, teamId));
    return result.map(r => r.user);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<void> {
    await db.update(teams).set(updates).where(eq(teams.id, id));
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async addTeamMember(teamId: number, userId: number): Promise<void> {
    await db.insert(teamMembers).values({ teamId, userId });
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await db.delete(teamMembers).where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
    );
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.isActive, true));
  }

  // Tournaments
  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(desc(tournaments.createdAt));
  }

  async getTournamentsByTeam(teamId: number): Promise<Tournament[]> {
    const result = await db
      .select({ tournament: tournaments })
      .from(tournaments)
      .innerJoin(tournamentParticipants, eq(tournaments.id, tournamentParticipants.tournamentId))
      .where(eq(tournamentParticipants.teamId, teamId));
    return result.map(r => r.tournament);
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db.insert(tournaments).values(insertTournament).returning();
    return tournament;
  }

  async updateTournament(id: number, updates: Partial<InsertTournament>): Promise<void> {
    await db.update(tournaments).set(updates).where(eq(tournaments.id, id));
  }

  async addTournamentParticipant(tournamentId: number, teamId: number): Promise<void> {
    await db.insert(tournamentParticipants).values({ tournamentId, teamId });
  }

  // Leagues
  async getLeague(id: number): Promise<League | undefined> {
    const [league] = await db.select().from(leagues).where(eq(leagues.id, id));
    return league || undefined;
  }

  async getAllLeagues(): Promise<League[]> {
    return await db.select().from(leagues).where(eq(leagues.isActive, true));
  }

  async getLeaguesByTeam(teamId: number): Promise<League[]> {
    const result = await db
      .select({ league: leagues })
      .from(leagues)
      .innerJoin(leagueParticipants, eq(leagues.id, leagueParticipants.leagueId))
      .where(eq(leagueParticipants.teamId, teamId));
    return result.map(r => r.league);
  }

  async createLeague(insertLeague: InsertLeague): Promise<League> {
    const [league] = await db.insert(leagues).values(insertLeague).returning();
    return league;
  }

  async updateLeague(id: number, updates: Partial<InsertLeague>): Promise<void> {
    await db.update(leagues).set(updates).where(eq(leagues.id, id));
  }

  async addLeagueParticipant(leagueId: number, teamId: number): Promise<void> {
    await db.insert(leagueParticipants).values({ leagueId, teamId });
  }

  async getLeagueStandings(leagueId: number): Promise<any[]> {
    const result = await db
      .select({
        team: teams,
        participant: leagueParticipants
      })
      .from(leagueParticipants)
      .innerJoin(teams, eq(leagueParticipants.teamId, teams.id))
      .where(eq(leagueParticipants.leagueId, leagueId))
      .orderBy(desc(leagueParticipants.points));
    
    return result.map((r, index) => ({
      position: index + 1,
      team: r.team,
      points: r.participant.points,
      matchesPlayed: r.participant.matchesPlayed,
      wins: r.participant.wins,
      draws: r.participant.draws,
      losses: r.participant.losses
    }));
  }

  async updateLeaguePoints(leagueId: number, teamId: number, points: number, wins: number, draws: number, losses: number): Promise<void> {
    await db.update(leagueParticipants)
      .set({
        points: sql`${leagueParticipants.points} + ${points}`,
        matchesPlayed: sql`${leagueParticipants.matchesPlayed} + 1`,
        wins: sql`${leagueParticipants.wins} + ${wins}`,
        draws: sql`${leagueParticipants.draws} + ${draws}`,
        losses: sql`${leagueParticipants.losses} + ${losses}`
      })
      .where(and(
        eq(leagueParticipants.leagueId, leagueId),
        eq(leagueParticipants.teamId, teamId)
      ));
  }

  // Matches
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchesByTeam(teamId: number): Promise<Match[]> {
    return await db.select().from(matches)
      .where(sql`${matches.team1Id} = ${teamId} OR ${matches.team2Id} = ${teamId}`)
      .orderBy(desc(matches.scheduledDate));
  }

  async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    return await db.select().from(matches)
      .where(eq(matches.status, 'scheduled'))
      .orderBy(matches.scheduledDate)
      .limit(limit);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<void> {
    await db.update(matches).set(updates).where(eq(matches.id, id));
  }

  async getMatchesInDateRange(startDate: Date, endDate: Date): Promise<Match[]> {
    return await db.select().from(matches)
      .where(and(
        sql`${matches.scheduledDate} >= ${startDate}`,
        sql`${matches.scheduledDate} <= ${endDate}`
      ))
      .orderBy(matches.scheduledDate);
  }

  // Notifications
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.count;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Team Invitations
  async getTeamInvitation(id: number): Promise<TeamInvitation | undefined> {
    const [invitation] = await db.select().from(teamInvitations).where(eq(teamInvitations.id, id));
    return invitation || undefined;
  }

  async getInvitationsByUser(userId: number): Promise<TeamInvitation[]> {
    return await db.select().from(teamInvitations)
      .where(and(
        eq(teamInvitations.userId, userId),
        eq(teamInvitations.status, 'pending')
      ))
      .orderBy(desc(teamInvitations.createdAt));
  }

  async createTeamInvitation(insertInvitation: InsertTeamInvitation): Promise<TeamInvitation> {
    const [invitation] = await db.insert(teamInvitations).values(insertInvitation).returning();
    return invitation;
  }

  async updateInvitationStatus(id: number, status: string): Promise<void> {
    await db.update(teamInvitations).set({ status }).where(eq(teamInvitations.id, id));
  }

  // Captain Requests
  async getCaptainRequests(): Promise<CaptainRequest[]> {
    return await db.select().from(captainRequests)
      .where(eq(captainRequests.status, 'pending'))
      .orderBy(desc(captainRequests.createdAt));
  }

  async createCaptainRequest(insertRequest: InsertCaptainRequest): Promise<CaptainRequest> {
    const [request] = await db.insert(captainRequests).values(insertRequest).returning();
    return request;
  }

  async updateCaptainRequestStatus(id: number, status: string): Promise<void> {
    await db.update(captainRequests).set({ status }).where(eq(captainRequests.id, id));
  }
}

export const storage = new DatabaseStorage();
