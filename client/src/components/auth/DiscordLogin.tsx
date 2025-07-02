import { FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export function DiscordLogin() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-primary-800 border-primary-700">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaDiscord className="text-white text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Conectar con Discord</h3>
            <p className="text-gray-400">
              Conecta tu cuenta de Discord para acceder a Rematch Liga Española
            </p>
          </div>

          <Button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-3"
          >
            <FaDiscord className="text-xl" />
            <span>Conectar con Discord</span>
          </Button>

          <p className="text-gray-400 text-xs text-center mt-4">
            Al conectarte, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
