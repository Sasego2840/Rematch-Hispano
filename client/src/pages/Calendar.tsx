import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: matches } = useQuery({
    queryKey: ["/api/matches/upcoming", { limit: 50 }],
    enabled: !!user,
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getMatchesForDate = (date: Date) => {
    if (!matches) return [];
    return matches.filter((match: any) => {
      const matchDate = new Date(match.scheduledDate);
      return matchDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const days = getDaysInMonth(currentDate);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Calendario de Partidos"
        subtitle="Programación de partidos y eventos"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="content-card">
            <div className="p-6 border-b border-primary-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="text-white border-primary-600 hover:bg-primary-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="text-white border-primary-600 hover:bg-primary-700"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="text-white border-primary-600 hover:bg-primary-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center font-medium text-gray-400 border-b border-primary-700">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-24 p-2" />;
                  }

                  const dayMatches = getMatchesForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`h-24 p-2 border border-primary-700 rounded-lg ${
                        isToday ? 'bg-blue-600 bg-opacity-20 border-blue-500' : 'bg-primary-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-blue-300' : 'text-white'
                        }`}>
                          {day.getDate()}
                        </span>
                        {dayMatches.length > 0 && (
                          <Badge variant="secondary" className="text-xs px-1">
                            {dayMatches.length}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayMatches.slice(0, 2).map((match: any, matchIndex: number) => (
                          <div
                            key={matchIndex}
                            className="text-xs bg-accent-red text-white px-2 py-1 rounded truncate"
                            title={`Partido ${match.status}`}
                          >
                            {new Date(match.scheduledDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        ))}
                        {dayMatches.length > 2 && (
                          <div className="text-xs text-gray-400 px-2">
                            +{dayMatches.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Matches List */}
          <Card className="content-card mt-8">
            <div className="p-6 border-b border-primary-700">
              <h3 className="text-xl font-semibold text-white">Próximos Partidos</h3>
            </div>
            <CardContent className="p-6">
              {matches && matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.slice(0, 10).map((match: any) => (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-primary-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-white">
                            {new Date(match.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(match.scheduledDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-accent-red rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">VS</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Partido programado</p>
                          <p className="text-gray-400 text-sm">
                            {match.tournamentId ? 'Torneo' : 'Liga'} • {match.status}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={match.status === 'scheduled' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {match.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No hay partidos programados
                  </h3>
                  <p className="text-gray-400">
                    Los partidos aparecerán aquí cuando sean programados
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
