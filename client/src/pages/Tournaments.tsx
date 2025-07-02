import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Plus, Users, Calendar, Clock, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createTournamentSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  maxTeams: z.number().min(2, "Mínimo 2 equipos").max(64, "Máximo 64 equipos"),
  isPublic: z.boolean(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
});

type CreateTournamentForm = z.infer<typeof createTournamentSchema>;

export function Tournaments() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["/api/tournaments"],
  });

  const { data: myTeams } = useQuery({
    queryKey: ["/api/teams/my"],
    enabled: !!user,
  });

  const form = useForm<CreateTournamentForm>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      maxTeams: 16,
      isPublic: true,
      startDate: "",
      endDate: "",
    },
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: CreateTournamentForm) => {
      const response = await apiRequest("POST", "/api/tournaments", {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Torneo creado",
        description: "El torneo ha sido creado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el torneo",
        variant: "destructive",
      });
    },
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async ({ tournamentId, teamId }: { tournamentId: number; teamId: number }) => {
      await apiRequest("POST", `/api/tournaments/${tournamentId}/join`, { teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Unido al torneo",
        description: "Tu equipo se ha unido al torneo exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo unir al torneo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTournamentForm) => {
    createTournamentMutation.mutate(data);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'registration': return 'bg-blue-600';
      case 'group_stage': return 'bg-yellow-600';
      case 'knockout': return 'bg-orange-600';
      case 'finals': return 'bg-red-600';
      case 'completed': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'registration': return 'Inscripción';
      case 'group_stage': return 'Fase de Grupos';
      case 'knockout': return 'Eliminatorias';
      case 'finals': return 'Finales';
      case 'completed': return 'Completado';
      default: return phase;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Gestión de Torneos"
        subtitle="Competiciones activas y próximas"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Torneos Disponibles</h2>
              <p className="text-gray-400">
                Únete a torneos existentes o crea uno nuevo
              </p>
            </div>
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Torneo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-primary-800 border-primary-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Torneo</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Torneo</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-field" placeholder="Ej: Torneo Elite 2024" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="input-field" placeholder="Descripción del torneo..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxTeams"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Máximo de Equipos</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  className="input-field"
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                              <FormLabel>Torneo Público</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Inicio</FormLabel>
                              <FormControl>
                                <Input {...field} type="datetime-local" className="input-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Fin</FormLabel>
                              <FormControl>
                                <Input {...field} type="datetime-local" className="input-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="btn-primary"
                          disabled={createTournamentMutation.isPending}
                        >
                          {createTournamentMutation.isPending ? "Creando..." : "Crear Torneo"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Tournaments Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament: any) => (
                <Card key={tournament.id} className="content-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-accent-red rounded-lg flex items-center justify-center">
                          <Trophy className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{tournament.name}</h3>
                          <Badge className={`${getPhaseColor(tournament.currentPhase)} text-white text-xs`}>
                            {getPhaseText(tournament.currentPhase)}
                          </Badge>
                        </div>
                      </div>
                      {tournament.isPublic && (
                        <Star className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>

                    {tournament.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {tournament.description}
                      </p>
                    )}

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Equipos:
                        </span>
                        <span className="text-white">0/{tournament.maxTeams}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Inicio:
                        </span>
                        <span className="text-white">
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Fin:
                        </span>
                        <span className="text-white">
                          {new Date(tournament.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {tournament.currentPhase === 'registration' && myTeams && myTeams.length > 0 && (
                        <Select 
                          onValueChange={(teamId) => 
                            joinTournamentMutation.mutate({ 
                              tournamentId: tournament.id, 
                              teamId: parseInt(teamId) 
                            })
                          }
                        >
                          <SelectTrigger className="flex-1 input-field">
                            <SelectValue placeholder="Unirse con equipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-primary-700 border-primary-600">
                            {myTeams.map((team: any) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      <Button variant="outline" className="flex-1">
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="content-card">
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No hay torneos disponibles
                </h3>
                <p className="text-gray-400 mb-6">
                  {isAdmin ? 
                    "Crea el primer torneo para que los equipos puedan competir" :
                    "Los torneos aparecerán aquí cuando estén disponibles"
                  }
                </p>
                {isAdmin && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Torneo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
