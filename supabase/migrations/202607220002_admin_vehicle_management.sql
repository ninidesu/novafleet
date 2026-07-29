grant select,insert,update,delete on fleet.vehicles to authenticated;

create policy "Fleet administrators can add vehicles"
on fleet.vehicles for insert to authenticated
with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));

create policy "Fleet administrators can update vehicles"
on fleet.vehicles for update to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'))
with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));

create policy "Fleet administrators can remove vehicles"
on fleet.vehicles for delete to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role='admin' and module='fleet'));
