import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/admin", { username, password });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Acceso concedido",
          description: "Bienvenido al panel de administración",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Credenciales de administrador incorrectas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-primary-800 border-primary-700">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Panel de Administración</h3>
            <p className="text-gray-400">Introduce las credenciales de administrador</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block text-gray-400 text-sm font-medium mb-2">
                Nombre de Usuario
              </Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Latinogang"
                required
              />
            </div>
            <div>
              <Label className="block text-gray-400 text-sm font-medium mb-2">
                Contraseña
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••••••"
                required
              />
            </div>
            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? "Verificando..." : "Acceder al Panel"}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
