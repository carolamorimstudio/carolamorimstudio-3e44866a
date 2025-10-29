import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Heart, Sparkles, Award } from 'lucide-react';

const Sobre = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif italic text-primary mb-4">
              Sobre o Carol Amorim Studio
            </h1>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-center text-muted-foreground leading-relaxed">
              O Carol Amorim Studio é especializado em extensão de cílios, beleza e autoestima. 
              Cada atendimento é feito com dedicação e profissionalismo, valorizando o olhar e 
              a confiança de cada cliente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Dedicação</h3>
              <p className="text-muted-foreground">
                Cada cliente recebe atenção exclusiva e personalizada, com todo o cuidado que você merece
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Qualidade</h3>
              <p className="text-muted-foreground">
                Utilizamos produtos premium e técnicas modernas para garantir resultados incríveis e duradouros
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Profissionalismo</h3>
              <p className="text-muted-foreground">
                Anos de experiência e aperfeiçoamento constante para oferecer sempre o melhor serviço
              </p>
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-lg border border-border mt-16">
            <h2 className="text-2xl font-serif italic text-primary mb-4 text-center">
              Nossa Missão
            </h2>
            <p className="text-center text-muted-foreground leading-relaxed">
              Realçar a beleza natural de cada cliente, proporcionando um olhar marcante e 
              autoestima elevada através de um atendimento acolhedor, técnicas especializadas 
              e produtos de alta qualidade. No Carol Amorim Studio, cada cliente é única e 
              merece se sentir especial.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
