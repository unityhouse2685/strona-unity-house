import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://ycuogutnwdybdeobowla.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdW9ndXRud2R5YmRlb2Jvd2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTE4NDAsImV4cCI6MjA5NDA2Nzg0MH0.ObkFIknc3Ce5KEmj435lI_8hi1T7E-lnxQuRSicZlPw"
);