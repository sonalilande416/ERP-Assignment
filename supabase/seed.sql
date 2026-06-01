insert into public.inventory (item_name, category, total_stock, available_stock) values
  ('MacBook Air M2', 'Laptop', 12, 8),
  ('Dell Latitude 7440', 'Laptop', 20, 14),
  ('27 inch USB-C Monitor', 'Screen', 18, 9),
  ('Figma Professional License', 'Software', 50, 37),
  ('JetBrains All Products License', 'Software', 25, 11),
  ('USB-C Docking Station', 'Accessory', 16, 5)
on conflict do nothing;
