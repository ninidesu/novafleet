-- Drivers can be created before they receive a NovaFleet login.
-- The UI already treats profile_id as an optional account link.
begin;

alter table fleet.drivers alter column profile_id drop not null;

commit;
