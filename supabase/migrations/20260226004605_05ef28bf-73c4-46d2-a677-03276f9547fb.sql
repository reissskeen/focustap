CREATE POLICY "Anyone can delete own demo seat by id"
ON public.demo_seats
FOR DELETE
USING (true);