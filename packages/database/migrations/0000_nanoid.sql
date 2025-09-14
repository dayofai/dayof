-- Custom SQL migration file, put your code below! --

-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create nanoid_optimized function
CREATE OR REPLACE FUNCTION public.nanoid_optimized(
  size integer, alphabet text, mask integer, step integer
) RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $function$
DECLARE
  idBuilder text := '';
  counter int;
  bytes bytea;
  alphabetIndex int;
  alphabetArray text[];
  alphabetLength int;
BEGIN
  IF size < 1 THEN
    RAISE EXCEPTION 'size must be > 0';
  END IF;

  alphabetArray := regexp_split_to_array(alphabet, '');
  alphabetLength := array_length(alphabetArray, 1);

  LOOP
    bytes := gen_random_bytes(step);
    FOR counter IN 0..step - 1 LOOP
      alphabetIndex := (get_byte(bytes, counter) & mask) + 1;
      IF alphabetIndex <= alphabetLength THEN
        idBuilder := idBuilder || alphabetArray[alphabetIndex];
        IF length(idBuilder) = size THEN
          RETURN idBuilder;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END
$function$;

-- Create main nanoid function with your custom default alphabet
CREATE OR REPLACE FUNCTION public.nanoid(
  size integer DEFAULT 12,
  alphabet text DEFAULT '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz',
  additionalbytesfactor double precision DEFAULT 1.02
) RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $function$
DECLARE
  alphabetLength int;
  mask int;
  step int;
BEGIN
  IF size IS NULL OR size < 1 THEN
    RAISE EXCEPTION 'The size must be defined and greater than 0!';
  END IF;

  IF alphabet IS NULL OR length(alphabet) < 2 OR length(alphabet) > 255 THEN
    RAISE EXCEPTION 'The alphabet must be between 2 and 255 characters!';
  END IF;

  IF additionalbytesfactor IS NULL OR additionalbytesfactor < 1 THEN
    RAISE EXCEPTION 'The additional bytes factor can''t be less than 1!';
  END IF;

  alphabetLength := length(alphabet);
  mask := (2 << cast(floor(log(alphabetLength - 1) / log(2)) as int)) - 1;
  step := cast(ceil(additionalbytesfactor * mask * size / alphabetLength) AS int);
  IF step > 1024 THEN
    step := 1024;
  END IF;

  RETURN nanoid_optimized(size, alphabet, mask, step);
END
$function$;

-- To rollback these changes, run:
-- DROP FUNCTION IF EXISTS public.nanoid(integer, text, double precision);
-- DROP FUNCTION IF EXISTS public.nanoid_optimized(integer, text, integer, integer);
