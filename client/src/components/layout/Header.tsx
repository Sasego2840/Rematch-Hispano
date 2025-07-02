import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isCaptain } = useAuth();

  return (
    <header className="bg-primary-800 border-b border-primary-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {isCaptain && (
            <Button className="btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Crear Equipo</span>
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar..."
              className="input-field pl-10 w-64"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
