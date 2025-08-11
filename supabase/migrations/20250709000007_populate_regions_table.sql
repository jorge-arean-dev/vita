-- Populate regions table with seed data
INSERT INTO regions (display_name, name, is_parent, is_active) VALUES
('North America', 'north-america', FALSE, true),
('South America', 'south-america', FALSE, true),
('Central America', 'central-america', FALSE, true),
('West Europe', 'west-europe', FALSE, true),
('East Europe', 'east-europe', FALSE, true),
('Africa', 'africa', true, true),
('Middle East', 'middle-east', FALSE, FALSE),
('Oceania', 'oceania', true, true),
('Americas', 'americas', true, true),
('Asia', 'asia', true, true),
('Europe', 'europe', true, true);