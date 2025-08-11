-- Allow NULL values in the region column of countries table
-- This enables countries to exist without specific sub-regions while still having parent regions

ALTER TABLE countries 
ALTER COLUMN region DROP NOT NULL;