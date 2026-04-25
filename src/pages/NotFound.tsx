import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="text-6xl">🪷</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            A rota <span className="font-mono text-xs">{location.pathname}</span> não existe.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/">Voltar ao início 💖</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
