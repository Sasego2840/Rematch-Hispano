import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertTeamSchema, insertTournamentSchema, insertLeagueSchema, insertMatchSchema, insertNotificationSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";

// Simple Discord OAuth simulation (in production, use passport-discord)
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "default_client_id";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "default_client_secret";
const REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || "localhost:5000";

// Admin credentials
const ADMIN_USERNAME = "Latinogang";
const ADMIN_PASSWORD = "Ligaesp2840";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'rematch-liga-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.user) {
      next();
    } else {
      res.status(401).json({ message: "No autorizado" });
    }
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Acceso denegado - Se requieren permisos de administrador" });
    }
  };

  const requireCaptain = (req: any, res: any, next: any) => {
    if (req.user && (req.user.role === 'captain' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(403).json({ message: "Acceso denegado - Se requieren permisos de capitán" });
    }
  };

  // Discord OAuth simulation
  app.get("/api/auth/discord", (req, res) => {
    const baseUrl = `https://${REPLIT_DOMAINS.split(',')[0]}` || "http://localhost:5000";
    const redirectUri = `${baseUrl}/api/auth/discord/callback`;
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
  });

  app.get("/api/auth/discord/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: "Código de autorización no proporcionado" });
    }

    try {
      // In a real implementation, exchange code for access token and get user info
      // For now, simulate a Discord user
      const discordUser = {
        id: `discord_${Date.now()}`,
        username: `Usuario#${Math.floor(Math.random() * 9999)}`,
        avatar: null
      };

      let user = await storage.getUserByDiscordId(discordUser.id);
      
      if (!user) {
        user = await storage.createUser({
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          discordAvatar: discordUser.avatar,
          role: 'user'
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error de inicio de sesión" });
        }
        res.redirect('/');
      });
    } catch (error) {
      res.status(500).json({ message: "Error en la autenticación con Discord" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "No autenticado" });
    }
  });

  // Admin authentication
  app.post("/api/auth/admin", (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      res.json({ success: true, message: "Acceso administrativo concedido" });
    } else {
      res.status(401).json({ success: false, message: "Credenciales de administrador incorrectas" });
    }
  });

  // User routes
  app.post("/api/users/:id/promote", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!['user', 'captain', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Rol inválido" });
      }

      await storage.updateUserRole(userId, role);
      res.json({ message: "Rol actualizado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar el rol del usuario" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener equipos" });
    }
  });

  app.get("/api/teams/my", requireAuth, async (req, res) => {
    try {
      const teams = await storage.getTeamsByUser(req.user.id);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener equipos del usuario" });
    }
  });

  app.post("/api/teams", requireCaptain, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse({
        ...req.body,
        captainId: req.user.id
      });
      
      const team = await storage.createTeam(teamData);
      await storage.addTeamMember(team.id, req.user.id);
      
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Error al crear equipo" });
    }
  });

  app.get("/api/teams/:id/members", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener miembros del equipo" });
    }
  });

  app.post("/api/teams/:id/invite", requireCaptain, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { userId } = req.body;

      const invitation = await storage.createTeamInvitation({
        teamId,
        userId,
        invitedBy: req.user.id
      });

      // Create notification for the invited user
      await storage.createNotification({
        userId,
        type: 'team_invitation',
        title: 'Invitación de equipo',
        message: `Has recibido una invitación para unirte a un equipo`,
        data: { teamId, invitationId: invitation.id }
      });

      res.status(201).json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Error al enviar invitación" });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", requireCaptain, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      await storage.removeTeamMember(teamId, userId);
      res.json({ message: "Miembro removido del equipo" });
    } catch (error) {
      res.status(500).json({ message: "Error al remover miembro del equipo" });
    }
  });

  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener torneos" });
    }
  });

  app.post("/api/tournaments", requireAdmin, async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(tournamentData);
      res.status(201).json(tournament);
    } catch (error) {
      res.status(400).json({ message: "Error al crear torneo" });
    }
  });

  app.post("/api/tournaments/:id/join", requireAuth, async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { teamId } = req.body;
      
      await storage.addTournamentParticipant(tournamentId, teamId);
      res.json({ message: "Equipo unido al torneo" });
    } catch (error) {
      res.status(500).json({ message: "Error al unirse al torneo" });
    }
  });

  // League routes
  app.get("/api/leagues", async (req, res) => {
    try {
      const leagues = await storage.getAllLeagues();
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener ligas" });
    }
  });

  app.post("/api/leagues", requireAdmin, async (req, res) => {
    try {
      const leagueData = insertLeagueSchema.parse(req.body);
      const league = await storage.createLeague(leagueData);
      res.status(201).json(league);
    } catch (error) {
      res.status(400).json({ message: "Error al crear liga" });
    }
  });

  app.get("/api/leagues/:id/standings", async (req, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const standings = await storage.getLeagueStandings(leagueId);
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener clasificaciones" });
    }
  });

  // Match routes
  app.get("/api/matches/upcoming", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const matches = await storage.getUpcomingMatches(limit);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener próximos partidos" });
    }
  });

  app.post("/api/matches", requireAdmin, async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      
      // Create notifications for both teams
      const team1Members = await storage.getTeamMembers(match.team1Id);
      const team2Members = await storage.getTeamMembers(match.team2Id);
      
      for (const member of [...team1Members, ...team2Members]) {
        await storage.createNotification({
          userId: member.id,
          type: 'match_scheduled',
          title: 'Partido programado',
          message: `Se ha programado un nuevo partido para tu equipo`,
          data: { matchId: match.id }
        });
      }
      
      res.status(201).json(match);
    } catch (error) {
      res.status(400).json({ message: "Error al crear partido" });
    }
  });

  app.patch("/api/matches/:id", requireAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateMatch(matchId, updates);
      
      // If match is completed, update league standings
      if (updates.status === 'completed' && updates.leagueId) {
        const match = await storage.getMatch(matchId);
        if (match) {
          const league = await storage.getLeague(match.leagueId);
          if (league) {
            if (updates.winnerId) {
              // Winner gets win points, loser gets loss points
              await storage.updateLeaguePoints(match.leagueId, updates.winnerId, league.pointsPerWin, 1, 0, 0);
              const loserId = match.team1Id === updates.winnerId ? match.team2Id : match.team1Id;
              await storage.updateLeaguePoints(match.leagueId, loserId, league.pointsPerLoss, 0, 0, 1);
            } else if (updates.isDraw) {
              // Both teams get draw points
              await storage.updateLeaguePoints(match.leagueId, match.team1Id, league.pointsPerDraw, 0, 1, 0);
              await storage.updateLeaguePoints(match.leagueId, match.team2Id, league.pointsPerDraw, 0, 1, 0);
            }
          }
        }
      }
      
      res.json({ message: "Partido actualizado" });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar partido" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener notificaciones" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener contador de notificaciones" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notificación marcada como leída" });
    } catch (error) {
      res.status(500).json({ message: "Error al marcar notificación como leída" });
    }
  });

  // Team invitation routes
  app.get("/api/invitations", requireAuth, async (req, res) => {
    try {
      const invitations = await storage.getInvitationsByUser(req.user.id);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener invitaciones" });
    }
  });

  app.patch("/api/invitations/:id", requireAuth, async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const { status } = req.body;
      
      const invitation = await storage.getTeamInvitation(invitationId);
      if (!invitation || invitation.userId !== req.user.id) {
        return res.status(404).json({ message: "Invitación no encontrada" });
      }
      
      await storage.updateInvitationStatus(invitationId, status);
      
      if (status === 'accepted') {
        await storage.addTeamMember(invitation.teamId, invitation.userId);
      }
      
      res.json({ message: "Invitación actualizada" });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar invitación" });
    }
  });

  // Captain request routes
  app.post("/api/captain-requests", requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      const request = await storage.createCaptainRequest({
        userId: req.user.id,
        reason
      });
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "Error al crear solicitud de capitán" });
    }
  });

  app.get("/api/captain-requests", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getCaptainRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener solicitudes de capitán" });
    }
  });

  app.patch("/api/captain-requests/:id", requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateCaptainRequestStatus(requestId, status);
      
      if (status === 'approved') {
        const request = await storage.getCaptainRequests();
        const targetRequest = request.find(r => r.id === requestId);
        if (targetRequest) {
          await storage.updateUserRole(targetRequest.userId, 'captain');
        }
      }
      
      res.json({ message: "Solicitud actualizada" });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar solicitud" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'authenticate') {
          // In a real implementation, validate the user session
          (ws as any).userId = data.userId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  // Function to broadcast notifications
  const broadcastNotification = (userId: number, notification: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && (client as any).userId === userId) {
        client.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
      }
    });
  };

  // Store the broadcast function for use in other parts of the application
  (app as any).broadcastNotification = broadcastNotification;

  return httpServer;
}
