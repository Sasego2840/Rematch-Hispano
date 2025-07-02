import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Medal, Plus, Trophy, Users, Target } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createLeagueSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  pointsPerWin: z.number().min(0, "Los puntos deben ser positivos").default(3),
  pointsPerDraw: z.number().min(0, "Los puntos deben ser positivos").default(1),
  pointsPerLoss: z.number().min(0, "Los puntos deben ser positivos").default(0),
});

type CreateLeagueForm = z.infer<typeof createLeagueSchema>;

export function Leagues() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);

  const { data: leagues, isLoading } = useQuery({
    queryKey: ["/api/leagues"],
  });

  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ["/api/leagues", selectedLeague, "standings"],
    enabled: !!selectedLeague,
  });

  const form = useForm<CreateLeagueForm>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    },
  });

  const createLeagueMutation = useMutation({
    mutationFn: async (data: CreateLeagueForm) => {
      const response = await apiRequest("POST", "/api/leagues", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Liga creada",
        description: "La liga ha sido creada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la liga",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateLeagueForm) => {
    createLeagueMutation.mutate(data);
  };

  // Set first league as selected if none selected
  useState(() => {
    if (leagues && leagues.length > 0 && !selectedLeague) {
      setSelectedLeague(leagues[0].id);
    }
  });

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400'; // Gold
      case 2: return 'text-gray-300';   // Silver
      case 3: return 'text-orange-400'; // Bronze
      default: return 'text-white';
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return position;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Gestión de Ligas"
        subtitle="Rankings y clasificaciones"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Ligas Activas</h2>
              <p className="text-gray-400">
                Consulta las clasificaciones y standings de las ligas
              </p>
            </div>
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Liga
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-primary-800 border-primary-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Liga</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la Liga</FormLabel>
                            <FormControl>
                              <Input {...field} className="input-field" placeholder="Ej: Liga Profesional 2024" />
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
                              <Textarea {...field} className="input-field" placeholder="Descripción de la liga..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="pointsPerWin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Puntos por Victoria</FormLabel>
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
                          name="pointsPerDraw"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Puntos por Empate</FormLabel>
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
                          name="pointsPerLoss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Puntos por Derrota</FormLabel>
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
                          disabled={createLeagueMutation.isPending}
                        >
                          {createLeagueMutation.isPending ? "Creando..." : "Crear Liga"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : leagues && leagues.length > 0 ? (
            <Tabs value={selectedLeague?.toString()} onValueChange={(value) => setSelectedLeague(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-4 bg-primary-800 mb-8">
                {leagues.slice(0, 4).map((league: any) => (
                  <TabsTrigger 
                    key={league.id} 
                    value={league.id.toString()}
                    className="data-[state=active]:bg-accent-red data-[state=active]:text-white"
                  >
                    {league.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {leagues.map((league: any) => (
                <TabsContent key={league.id} value={league.id.toString()}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* League Info */}
                    <Card className="content-card">
                      <div className="p-6 border-b border-primary-700">
                        <h3 className="text-xl font-semibold text-white flex items-center">
                          <Medal className="w-5 h-5 mr-2 text-accent-orange" />
                          Información de la Liga
                        </h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium mb-2">{league.name}</h4>
                            {league.description && (
                              <p className="text-gray-400 text-sm">{league.description}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 flex items-center">
                                <Trophy className="w-4 h-4 mr-2" />
                                Victoria:
                              </span>
                              <Badge className="bg-green-600 text-white">
                                {league.pointsPerWin} pts
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                Empate:
                              </span>
                              <Badge className="bg-yellow-600 text-white">
                                {league.pointsPerDraw} pts
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                Derrota:
                              </span>
                              <Badge className="bg-red-600 text-white">
                                {league.pointsPerLoss} pts
                              </Badge>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-primary-700">
                            <Badge 
                              className={`${league.isActive ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                            >
                              {league.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* League Standings */}
                    <div className="lg:col-span-2">
                      <Card className="content-card">
                        <div className="p-6 border-b border-primary-700">
                          <h3 className="text-xl font-semibold text-white flex items-center">
                            <Trophy className="w-5 h-5 mr-2 text-accent-red" />
                            Clasificación
                          </h3>
                        </div>
                        <CardContent className="p-0">
                          {standingsLoading ? (
                            <div className="p-6">
                              <Skeleton className="h-64 w-full" />
                            </div>
                          ) : standings && standings.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow className="border-primary-700">
                                  <TableHead className="text-gray-400">Pos.</TableHead>
                                  <TableHead className="text-gray-400">Equipo</TableHead>
                                  <TableHead className="text-gray-400 text-center">PJ</TableHead>
                                  <TableHead className="text-gray-400 text-center">G</TableHead>
                                  <TableHead className="text-gray-400 text-center">E</TableHead>
                                  <TableHead className="text-gray-400 text-center">P</TableHead>
                                  <TableHead className="text-gray-400 text-center">Pts</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {standings.map((standing: any, index: number) => (
                                  <TableRow key={standing.team.id} className="border-primary-700">
                                    <TableCell className={`font-medium ${getPositionColor(standing.position)}`}>
                                      {getPositionIcon(standing.position)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-accent-red rounded-lg flex items-center justify-center">
                                          <Medal className="text-white text-sm" />
                                        </div>
                                        <span className="text-white font-medium">{standing.team.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center text-white">{standing.matchesPlayed}</TableCell>
                                    <TableCell className="text-center text-green-400">{standing.wins}</TableCell>
                                    <TableCell className="text-center text-yellow-400">{standing.draws}</TableCell>
                                    <TableCell className="text-center text-red-400">{standing.losses}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge className="bg-blue-600 text-white font-bold">
                                        {standing.points}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="p-12 text-center">
                              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-white mb-2">
                                No hay equipos en esta liga
                              </h3>
                              <p className="text-gray-400">
                                Los equipos aparecerán aquí cuando se unan a la liga
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="content-card">
              <CardContent className="p-12 text-center">
                <Medal className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No hay ligas disponibles
                </h3>
                <p className="text-gray-400 mb-6">
                  {isAdmin ? 
                    "Crea la primera liga para que los equipos puedan competir" :
                    "Las ligas aparecerán aquí cuando estén disponibles"
                  }
                </p>
                {isAdmin && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Liga
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
