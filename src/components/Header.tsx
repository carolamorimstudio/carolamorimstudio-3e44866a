import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Calendar, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-serif italic text-primary">
            Carol Amorim Studio
          </h1>
        </Link>
        
        <nav className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/galeria')}>
            <ImageIcon className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Galeria</span>
          </Button>
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground">
                Olá, {user.email?.split('@')[0]}
              </span>
              {isAdmin ? (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Painel Admin</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate('/agendamentos')}>
                  <Calendar className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Agendamentos</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sair</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate('/cadastro')}>
                Criar Conta
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
