-- Populate lookup tables with initial data

-- Industries (generate name from display_name)
INSERT INTO public.industries (display_name) VALUES
('Technology (includes SaaS, Software, AI, etc.)'),
('Financial Services / Fintech'),
('Healthcare'),
('E-commerce'),
('Education / EdTech'),
('Marketing & Advertising'),
('Real Estate / PropTech'),
('Media & Entertainment'),
('Retail'),
('Transportation & Logistics'),
('Manufacturing'),
('Legal Services'),
('Government & Public Sector'),
('Nonprofit'),
('HR / Staffing');

-- Job commitment types
INSERT INTO public.job_commitment_types (name, display_name) VALUES
('full_time', 'Full-time'),
('part_time', 'Part-time'),
('hourly', 'Hourly');

-- Job durations
INSERT INTO public.job_durations (name, display_name) VALUES
('2_4_weeks', '2-4 weeks'),
('4_8_weeks', '4-8 weeks'),
('3_6_months', '3-6 months'),
('6_12_months', '6-12 months'),
('12_plus_months', '12+ months'),
('permanent', 'Permanent');

-- Job location types
INSERT INTO public.job_location_types (name, display_name) VALUES
('remote_global', 'Remote (global)'),
('remote_region_specific', 'Remote (region specific)'),
('remote_country_specific', 'Remote (country specific)'),
('hybrid', 'Hybrid'),
('on_site', 'On-site');

-- Job pay frequencies
INSERT INTO public.job_pay_frequencies (name, display_name) VALUES
('hourly', 'Hourly'),
('weekly', 'Weekly'),
('monthly', 'Monthly');

-- Proficiency levels
INSERT INTO public.proficiency_levels (name, display_name) VALUES
('beginner', 'Beginner'),
('advanced', 'Advanced'),
('expert', 'Expert');

-- Question types
INSERT INTO public.question_types (name, display_name) VALUES
('technical', 'Technical Skills & Domain Knowledge'),
('problem_solving', 'Problem-Solving & Analytical Thinking'),
('communication', 'Communication & Collaboration'),
('leadership', 'Leadership & Initiative'),
('learning', 'Adaptability & Learning Agility'),
('cultural', 'Cultural Fit & Values Alignment');

-- Skill sources
INSERT INTO public.skill_sources (name, display_name) VALUES
('linkedin', 'LinkedIn'),
('resume', 'Resume');

-- Skill types
INSERT INTO public.skill_types (name, display_name) VALUES
('technical', 'Technical'),
('soft_skill', 'Soft skill'),
('role', 'Role'),
('certification', 'Certification');