import { Instagram, MessageCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Carol Amorim Studio. Todos os direitos reservados.
          </p>
          
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/carolamorimstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="text-sm">Instagram</span>
            </a>
            
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
