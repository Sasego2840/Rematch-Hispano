import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, Users, Calendar, Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";

export function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { notifications: realtimeNotifications } = useWebSocket();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const { data: invitations } = useQuery({
    queryKey: ["/api/invitations"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: number; status: string }) => {
      await apiRequest("PATCH", `/api/invitations/${invitationId}`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams/my"] });
      toast({
        title: status === 'accepted' ? "Invitación aceptada" : "Invitación rechazada",
        description: status === 'accepted' ? 
          "Te has unido al equipo exitosamente" : 
          "Has rechazado la invitación",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo procesar la invitación",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_invitation':
        return <Users className="w-5 h-5" />;
      case 'match_scheduled':
        return <Calendar className="w-5 h-5" />;
      case 'match_result':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'team_invitation':
        return 'border-blue-500 bg-blue-600 bg-opacity-20';
      case 'match_scheduled':
        return 'border-green-500 bg-green-600 bg-opacity-20';
      case 'match_result':
        return 'border-purple-500 bg-purple-600 bg-opacity-20';
      default:
        return 'border-gray-500 bg-gray-600 bg-opacity-20';
    }
  };

  // Combine API notifications with real-time notifications
  const allNotifications = [
    ...(realtimeNotifications || []),
    ...(notifications || [])
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Centro de Notificaciones"
        subtitle="Gestiona tus mensajes y alertas"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Team Invitations */}
          {invitations && invitations.length > 0 && (
            <Card className="content-card">
              <div className="p-6 border-b border-primary-700">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-400" />
                  Invitaciones de Equipo
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {invitations.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      className="border border-blue-500 bg-blue-600 bg-opacity-20 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Users className="text-blue-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-white font-medium">Invitación de equipo</p>
                            <p className="text-gray-300 text-sm">
                              Has recibido una invitación para unirte a un equipo
                            </p>
                            <div className="flex space-x-2 mt-3">
                              <Button
                                onClick={() => handleInvitationMutation.mutate({
                                  invitationId: invitation.id,
                                  status: 'accepted'
                                })}
                                disabled={handleInvitationMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                onClick={() => handleInvitationMutation.mutate({
                                  invitationId: invitation.id,
                                  status: 'rejected'
                                })}
                                disabled={handleInvitationMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Notifications */}
          <Card className="content-card">
            <div className="p-6 border-b border-primary-700">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-accent-orange" />
                Todas las Notificaciones
              </h3>
            </div>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : allNotifications && allNotifications.length > 0 ? (
                <div className="space-y-4">
                  {allNotifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`border rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                        !notification.isRead ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-blue-400 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-white font-medium">{notification.title}</p>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  Nuevo
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm">{notification.message}</p>
                            <p className="text-gray-400 text-xs mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="text-gray-400 hover:text-white"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-400">
                    Cuando recibas notificaciones, aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
