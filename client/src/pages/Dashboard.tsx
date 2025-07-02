import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, Medal, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();

  const { data: myTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams/my"],
    enabled: !!user,
  });

  const { data: upcomingMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches/upcoming", { limit: 5 }],
    enabled: !!user,
  });

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["/api/tournaments"],
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'win': return 'bg-green-600';
      case 'join': return 'bg-blue-600';
      case 'tournament': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const mockRecentActivity = [
    { id: 1, type: 'win', message: 'Victoria contra Equipo Dragones', time: 'Hace 2 horas' },
    { id: 2, type: 'join', message: 'Nuevo miembro se unió al equipo', time: 'Ayer' },
    { id: 3, type: 'tournament', message: 'Clasificado para semifinales del Torneo Elite', time: 'Hace 3 días' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Dashboard"
        subtitle="Resumen de tu actividad en Rematch Liga Española"
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center">
                  <Users className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {teamsLoading ? <Skeleton className="h-8 w-8" /> : myTeams?.length || 0}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Mis Equipos</h3>
              <p className="text-green-400 text-sm mt-1">Activos</p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {tournamentsLoading ? <Skeleton className="h-8 w-8" /> : tournaments?.length || 0}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Torneos Activos</h3>
              <p className="text-yellow-400 text-sm mt-1">Disponibles</p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Medal className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold text-white">-</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Posición en Liga</h3>
              <p className="text-green-400 text-sm mt-1">No participando</p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="text-white text-xl" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {matchesLoading ? <Skeleton className="h-8 w-8" /> : upcomingMatches?.length || 0}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium">Próximos Partidos</h3>
              <p className="text-blue-400 text-sm mt-1">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Upcoming Matches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="content-card">
            <div className="p-6 border-b border-primary-700">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Calendar className="mr-3 text-accent-orange" />
                Actividad Reciente
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {mockRecentActivity.length > 0 ? (
                  mockRecentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.message}</p>
                        <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card className="content-card">
            <div className="p-6 border-b border-primary-700">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Trophy className="mr-3 text-accent-red" />
                Próximos Partidos
              </h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingMatches && upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match: any) => (
                    <div key={match.id} className="bg-primary-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent-red rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">VS</span>
                          </div>
                          <span className="text-white font-medium">Partido programado</span>
                        </div>
                        <Badge variant="secondary">
                          {match.tournamentId ? 'Torneo' : 'Liga'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {new Date(match.scheduledDate).toLocaleDateString()}
                        </span>
                        <span className="text-blue-400 capitalize">{match.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No hay partidos próximos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
