-- Execute no SQL Editor do Supabase
-- Função para decrementar estoque de forma segura (sem ir abaixo de zero)

create or replace function decrementar_estoque(produto_id uuid, quantidade int)
returns void as $$
begin
  update produtos
  set estoque = greatest(0, estoque - quantidade)
  where id = produto_id;
end;
$$ language plpgsql security definer;
