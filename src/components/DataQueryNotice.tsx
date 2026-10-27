import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

type DataQueryNoticeProps = {
  loading?: boolean;
  error?: Error | null;
  label: string;
  retry: () => void;
};

export function DataQueryNotice({ loading, error, label, retry }: DataQueryNoticeProps) {
  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5" role="alert">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Não foi possível carregar {label}.</p>
              <p className="text-sm text-muted-foreground">
                Verifique a conexão ou suas permissões e tente novamente. Nenhum dado foi apagado.
              </p>
              <p className="text-xs text-muted-foreground mt-1 break-words">{error.message}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={retry} className="self-start">
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (loading) {
    return (
      <div role="status" className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando {label}...
      </div>
    );
  }
  return null;
}
