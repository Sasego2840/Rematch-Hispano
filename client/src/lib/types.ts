export type User = {
  id: number;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  role: 'user' | 'captain' | 'admin';
  createdAt: string;
};

export type Team = {
  id: number;
  name: string;
  description?: string;
  platform: 'PC' | 'Steam' | 'Xbox' | 'Gamepass';
  imageUrl?: string;
  captainId: number;
  isActive: boolean;
  createdAt: string;
};

export type Tournament = {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  maxTeams: number;
  currentPhase: string;
  startDate: string;
  endDate: string;
  bracketData?: any;
  createdAt: string;
};

export type League = {
  id: number;
  name: string;
  description?: string;
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  isActive: boolean;
  createdAt: string;
};

export type Match = {
  id: number;
  tournamentId?: number;
  leagueId?: number;
  team1Id: number;
  team2Id: number;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  winnerId?: number;
  isDraw: boolean;
  createdAt: string;
};

export type Notification = {
  id: number;
  userId: number;
  type: 'team_invitation' | 'match_scheduled' | 'match_result' | 'general';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
};

export type LeagueStanding = {
  position: number;
  team: Team;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
};

export type TeamInvitation = {
  id: number;
  teamId: number;
  userId: number;
  invitedBy: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

export type CaptainRequest = {
  id: number;
  userId: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};
