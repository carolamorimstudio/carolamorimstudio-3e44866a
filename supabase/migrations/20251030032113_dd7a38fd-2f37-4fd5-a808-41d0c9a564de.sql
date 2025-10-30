-- Insert admin email setting
INSERT INTO public.site_settings (key, value)
VALUES ('admin_email', 'contatocarolamorimstudio@gmail.com')
ON CONFLICT (key) DO UPDATE
SET value = 'contatocarolamorimstudio@gmail.com';