import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sparkles, Clock, Heart, Star, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBooking = () => {
    if (user) {
      navigate('/agendamentos');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif italic text-primary mb-6 animate-fade-in">
              Realce a Beleza do Seu Olhar
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Extensão de cílios profissional com dedicação, carinho e expertise. 
              Cada atendimento é único, pensado especialmente para você.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleBooking} className="shadow-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Horário
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/sobre')}>
                Conhecer o Studio
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-card py-16 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Qualidade Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Produtos de alta qualidade para resultados duradouros
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Pontualidade</h3>
                <p className="text-sm text-muted-foreground">
                  Respeito ao seu tempo com horários organizados
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Atendimento Personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Cada cliente recebe atenção especial e exclusiva
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Excelência</h3>
                <p className="text-sm text-muted-foreground">
                  Profissionalismo e dedicação em cada detalhe
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center bg-card p-8 rounded-2xl shadow-lg border border-border">
            <h2 className="text-3xl font-serif italic text-primary mb-4">
              Pronta para se Sentir Ainda Mais Linda?
            </h2>
            <p className="text-muted-foreground mb-6">
              Agende seu horário agora e descubra o poder de um olhar marcante
            </p>
            <Button size="lg" onClick={handleBooking} className="shadow-lg">
              Fazer Agendamento Online
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
