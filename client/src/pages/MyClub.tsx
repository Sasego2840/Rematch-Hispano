import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Edit, LogOut, UserPlus, Calendar, Trophy, Medal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FaDiscord } from "react-icons/fa";

export function MyClub() {
  const { user, isCaptain } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams/my"],
    enabled: !!user,
  });

  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/teams", myTeams?.[0]?.id, "members"],
    enabled: !!myTeams?.[0]?.id,
  });

  const { data: tournaments } = useQuery({
    queryKey: ["/api/tournaments"],
  });

  const { data: leagues } = useQuery({
    queryKey: ["/api/leagues"],
  });

  const leaveTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      await apiRequest("DELETE", `/api/teams/${teamId}/members/${user?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/my"] });
      toast({
        title: "Equipo abandonado",
        description: "Has abandonado el equipo exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo abandonar el equipo",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: number }) => {
      await apiRequest("DELETE", `/api/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Miembro removido",
        description: "El miembro ha sido removido del equipo",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo remover al miembro",
        variant: "destructive",
      });
    },
  });

  const currentTeam = myTeams?.[0];

  if (teamsLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mi Club" subtitle="Gestiona tu equipo y membresía" />
        <main className="flex-1 overflow-y-auto p-6">
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mi Club" subtitle="Gestiona tu equipo y membresía" />
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="content-card">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No perteneces a ningún equipo
              </h3>
              <p className="text-gray-400 mb-6">
                {isCaptain ? 
                  "Crea un equipo para comenzar a competir en torneos y ligas" :
                  "Solicita una invitación o el rol de capitán para unirte a un equipo"
                }
              </p>
              {isCaptain && (
                <Button className="btn-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Equipo
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isCaptainOfTeam = currentTeam.captainId === user?.id;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Mi Club" subtitle="Gestiona tu equipo y membresía" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Team Header */}
          <Card className="content-card p-8 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Shield className="text-white text-3xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{currentTeam.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {currentTeam.platform}
                    </span>
                    <span className="flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      {teamMembers?.length || 0} miembros
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(currentTeam.createdAt).getFullYear()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isCaptainOfTeam && (
                      <Badge className="bg-accent-red text-white">Capitán</Badge>
                    )}
                    <Badge className="bg-green-600 text-white">Activo</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isCaptainOfTeam && (
                  <Button className="btn-secondary">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => leaveTeamMutation.mutate(currentTeam.id)}
                  disabled={leaveTeamMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Abandonar
                </Button>
              </div>
            </div>
          </Card>

          {/* Team Members */}
          <Card className="content-card mb-8">
            <div className="p-6 border-b border-primary-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Miembros del Equipo</h3>
              {isCaptainOfTeam && (
                <Button className="btn-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invitar Jugador
                </Button>
              )}
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {membersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-primary-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                          <FaDiscord className="text-lg" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.discordUsername}</p>
                          <p className="text-gray-400 text-sm capitalize">
                            {member.id === currentTeam.captainId ? 'Capitán' : member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={member.id === currentTeam.captainId ? "default" : "secondary"}>
                          {member.id === currentTeam.captainId ? 'Capitán' : 'Jugador'}
                        </Badge>
                        {isCaptainOfTeam && member.id !== currentTeam.captainId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMemberMutation.mutate({ 
                              teamId: currentTeam.id, 
                              userId: member.id 
                            })}
                            disabled={removeMemberMutation.isPending}
                            className="text-gray-400 hover:text-red-400"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No hay miembros en el equipo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Competitions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="content-card">
              <div className="p-6 border-b border-primary-700">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Torneos Activos
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {tournaments && tournaments.length > 0 ? (
                    tournaments.slice(0, 3).map((tournament: any) => (
                      <div key={tournament.id} className="bg-primary-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{tournament.name}</h4>
                          <Badge className="bg-accent-orange text-white">
                            {tournament.currentPhase}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No hay torneos activos</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="content-card">
              <div className="p-6 border-b border-primary-700">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Medal className="w-5 h-5 mr-2" />
                  Ligas
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {leagues && leagues.length > 0 ? (
                    leagues.slice(0, 3).map((league: any) => (
                      <div key={league.id} className="bg-primary-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{league.name}</h4>
                          <Badge className="bg-green-600 text-white">
                            Activa
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {league.pointsPerWin} pts por victoria • {league.pointsPerDraw} pts por empate
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No hay ligas activas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
