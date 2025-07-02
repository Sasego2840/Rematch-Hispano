import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Settings, Shield, Users, Trophy, Medal, Calendar, 
  Search, Edit, Pause, Trash, Crown, SearchSlash, Ban,
  Plus, CheckCircle, XCircle, Clock
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminLogin } from "@/components/auth/AdminLogin";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaDiscord } from "react-icons/fa";

const matchSchema = z.object({
  team1Id: z.number().min(1, "Selecciona el primer equipo"),
  team2Id: z.number().min(1, "Selecciona el segundo equipo"),
  scheduledDate: z.string().min(1, "La fecha es requerida"),
  tournamentId: z.number().optional(),
  leagueId: z.number().optional(),
});

type MatchForm = z.infer<typeof matchSchema>;

export function Admin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateMatchDialogOpen, setIsCreateMatchDialogOpen] = useState(false);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: isAdminAuthenticated,
  });

  const { data: tournaments } = useQuery({
    queryKey: ["/api/tournaments"],
    enabled: isAdminAuthenticated,
  });

  const { data: leagues } = useQuery({
    queryKey: ["/api/leagues"],
    enabled: isAdminAuthenticated,
  });

  const { data: captainRequests } = useQuery({
    queryKey: ["/api/captain-requests"],
    enabled: isAdminAuthenticated,
  });

  const form = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      team1Id: 0,
      team2Id: 0,
      scheduledDate: "",
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: MatchForm) => {
      const response = await apiRequest("POST", "/api/matches", {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setIsCreateMatchDialogOpen(false);
      form.reset();
      toast({
        title: "Partido creado",
        description: "El partido ha sido programado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el partido",
        variant: "destructive",
      });
    },
  });

  const handleCaptainRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      await apiRequest("PATCH", `/api/captain-requests/${requestId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captain-requests"] });
      toast({
        title: "Solicitud procesada",
        description: "La solicitud de capitán ha sido procesada",
      });
    },
  });

  const promoteUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest("POST", `/api/users/${userId}/promote`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Usuario promovido",
        description: "El rol del usuario ha sido actualizado",
      });
    },
  });

  const onSubmitMatch = (data: MatchForm) => {
    createMatchMutation.mutate(data);
  };

  // Show admin login if not authenticated
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Panel de Administración"
          subtitle="Acceso restringido - Se requieren permisos de administrador"
        />
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <Card className="content-card max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Acceso Denegado
              </h3>
              <p className="text-gray-400">
                Se requieren permisos de administrador para acceder a esta sección
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <AdminLogin
        onSuccess={() => setIsAdminAuthenticated(true)}
        onCancel={() => {}}
      />
    );
  }

  const filteredTeams = teams?.filter((team: any) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Panel de Administración"
        subtitle="Gestión completa de la plataforma"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Equipos</p>
                    <p className="text-2xl font-bold text-white">
                      {teamsLoading ? "-" : teams?.length || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Torneos Activos</p>
                    <p className="text-2xl font-bold text-white">
                      {tournaments?.length || 0}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-accent-red" />
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Ligas Activas</p>
                    <p className="text-2xl font-bold text-white">
                      {leagues?.length || 0}
                    </p>
                  </div>
                  <Medal className="w-8 h-8 text-accent-orange" />
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Solicitudes Pendientes</p>
                    <p className="text-2xl font-bold text-white">
                      {captainRequests?.length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="content-card mb-8">
            <div className="p-6 border-b border-primary-700">
              <h3 className="text-lg font-semibold text-white">Acciones Rápidas</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="btn-primary p-6 h-auto flex-col space-y-2">
                  <Trophy className="w-6 h-6" />
                  <span>Crear Torneo</span>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex-col space-y-2">
                  <Medal className="w-6 h-6" />
                  <span>Crear Liga</span>
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white p-6 h-auto flex-col space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Gestionar Usuarios</span>
                </Button>
                <Dialog open={isCreateMatchDialogOpen} onOpenChange={setIsCreateMatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white p-6 h-auto flex-col space-y-2">
                      <Calendar className="w-6 h-6" />
                      <span>Programar Partido</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-primary-800 border-primary-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Programar Nuevo Partido</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitMatch)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="team1Id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Equipo Local</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                  <FormControl>
                                    <SelectTrigger className="input-field">
                                      <SelectValue placeholder="Seleccionar equipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-primary-700 border-primary-600">
                                    {teams?.map((team: any) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="team2Id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Equipo Visitante</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                  <FormControl>
                                    <SelectTrigger className="input-field">
                                      <SelectValue placeholder="Seleccionar equipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-primary-700 border-primary-600">
                                    {teams?.map((team: any) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="scheduledDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha y Hora</FormLabel>
                              <FormControl>
                                <Input {...field} type="datetime-local" className="input-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tournamentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Torneo (Opcional)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                                <FormControl>
                                  <SelectTrigger className="input-field">
                                    <SelectValue placeholder="Seleccionar torneo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-primary-700 border-primary-600">
                                  {tournaments?.map((tournament: any) => (
                                    <SelectItem key={tournament.id} value={tournament.id.toString()}>
                                      {tournament.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="leagueId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Liga (Opcional)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                                <FormControl>
                                  <SelectTrigger className="input-field">
                                    <SelectValue placeholder="Seleccionar liga" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-primary-700 border-primary-600">
                                  {leagues?.map((league: any) => (
                                    <SelectItem key={league.id} value={league.id.toString()}>
                                      {league.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateMatchDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            className="btn-primary"
                            disabled={createMatchMutation.isPending}
                          >
                            {createMatchMutation.isPending ? "Creando..." : "Crear Partido"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Management Tabs */}
          <Tabs defaultValue="teams" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-primary-800">
              <TabsTrigger value="teams" className="data-[state=active]:bg-accent-red">
                Gestión de Equipos
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-accent-red">
                Gestión de Usuarios
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-accent-red">
                Solicitudes de Capitán
              </TabsTrigger>
            </TabsList>

            {/* Teams Management */}
            <TabsContent value="teams">
              <Card className="content-card">
                <div className="p-6 border-b border-primary-700 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Gestión de Equipos</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar equipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 w-64"
                      />
                    </div>
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Equipo
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  {teamsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredTeams.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {filteredTeams.map((team: any) => (
                        <div key={team.id} className="flex items-center justify-between p-4 bg-primary-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-accent-red rounded-lg flex items-center justify-center">
                              <Shield className="text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{team.name}</p>
                              <p className="text-gray-400 text-sm">
                                Plataforma: {team.platform}
                                {team.isActive ? ' • Activo' : ' • Inactivo'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
                              <Pause className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No se encontraron equipos
                      </h3>
                      <p className="text-gray-400">
                        {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay equipos registrados'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Management */}
            <TabsContent value="users">
              <Card className="content-card">
                <div className="p-6 border-b border-primary-700">
                  <h3 className="text-xl font-semibold text-white">Gestión de Usuarios</h3>
                </div>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Gestión de Usuarios
                    </h3>
                    <p className="text-gray-400">
                      Funcionalidad de gestión de usuarios en desarrollo
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Captain Requests */}
            <TabsContent value="requests">
              <Card className="content-card">
                <div className="p-6 border-b border-primary-700">
                  <h3 className="text-xl font-semibold text-white">Solicitudes de Capitán</h3>
                </div>
                <CardContent className="p-6">
                  {captainRequests && captainRequests.length > 0 ? (
                    <div className="space-y-4">
                      {captainRequests.map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-primary-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <FaDiscord />
                            </div>
                            <div>
                              <p className="text-white font-medium">Solicitud de Capitán</p>
                              <p className="text-gray-400 text-sm">
                                {request.reason || 'Sin razón especificada'}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleCaptainRequestMutation.mutate({
                                requestId: request.id,
                                status: 'approved'
                              })}
                              disabled={handleCaptainRequestMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              onClick={() => handleCaptainRequestMutation.mutate({
                                requestId: request.id,
                                status: 'rejected'
                              })}
                              disabled={handleCaptainRequestMutation.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No hay solicitudes pendientes
                      </h3>
                      <p className="text-gray-400">
                        Las solicitudes de capitán aparecerán aquí cuando se reciban
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
