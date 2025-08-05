-- Add 'user_input' to skill_sources lookup table
-- This allows manually added skills to have a proper source reference

INSERT INTO public.skill_sources (name, display_name) VALUES
('user_input', 'User Input');