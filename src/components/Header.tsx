import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-serif italic text-primary">
            Carol Amorim Studio
          </h1>
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground">
                Olá, {user.email?.split('@')[0]}
              </span>
              {isAdmin ? (
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  <User className="h-4 w-4 mr-2" />
                  Painel Admin
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate('/agendamentos')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Meus Agendamentos
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/cadastro')}>
                Criar Conta
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
