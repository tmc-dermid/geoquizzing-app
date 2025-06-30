-- opcja z takimi samymi nazwami pól ID:
BEGIN;
CREATE TABLE IF NOT EXISTS test_countries (
    id SERIAL PRIMARY KEY,
    country_name TEXT NOT NULL,
    capital TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS other_countries (
    id SERIAL PRIMARY KEY,
    country_name TEXT NOT NULL,
    capital TEXT NOT NULL
);
COMMIT;

-- opcja z różnymi nazwami pól ID:
BEGIN;
CREATE TABLE IF NOT EXISTS test_countries (
    tcid SERIAL PRIMARY KEY,
    country_name TEXT NOT NULL,
    capital TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS other_countries (
    ocid SERIAL PRIMARY KEY,
    country_name TEXT NOT NULL,
    capital TEXT NOT NULL
);
COMMIT;

BEGIN;
INSERT INTO test_countries(country_name, capital)
VALUES
('Poland', 'Warsaw'),
('Nigeria', 'Abuja'),
('Mali', 'Bamako'),
('Poland', 'Warsaw'),
('Greece', 'Athens'),
('Greece', 'Athens'),
('China','Beijing'),
('Peru','Lima'),
('China', 'Beijing');

INSERT INTO other_countries(country_name, capital)
VALUES
('Poland', 'Warsaw'),
('Nigeria', 'Abuja'),
('Mali', 'Bamako'),
('Poland', 'Warsaw'),
('Greece', 'Athens'),
('Greece', 'Athens'),
('China','Beijing'),
('Peru','Lima'),
('China', 'Beijing');
COMMIT;

SELECT * FROM test_countries
UNION ALL
SELECT * FROM other_countries;

-- Method 1 - using MIN and GROUP BY:
DELETE FROM test_countries
WHERE id NOT IN (
    SELECT MIN(id) FROM test_countries
    GROUP BY country_name, capital
    );

--Method 2 - using MAX, GROUP BY and HAVING:
DELETE FROM test_countries
WHERE id IN (
    SELECT MAX(id) FROM test_countries
    GROUP BY country_name, capital
    HAVING COUNT(*) > 1
    );

-- Method 3 - using SELF JOIN:
DELETE FROM test_countries c1
USING test_countries c2
WHERE c1.country_name = c2.country_name
AND c1.id > c2.id;
-- OR
DELETE FROM other_countries
WHERE id IN (
    SELECT oc2.id FROM other_countries oc1
    JOIN other_countries oc2
    ON oc1.country_name = oc2.country_name AND oc1.capital = oc2.capital
    WHERE oc1.id < oc2.id
);

--Method 4 - using Window Function:
DELETE FROM test_countries
WHERE id IN (
    SELECT id FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY country_name, capital) AS rn
        FROM test_countries
    ) tc
WHERE tc.rn > 1
);

--Method 5 - using CTE and Window Function:
WITH removeDuplicates AS (
    SELECT id FROM (
        SELECT id, country_name, ROW_NUMBER() OVER(
        PARTITION BY country_name ORDER BY id ASC) AS RowNo
        FROM test_countries
    ) tc
    WHERE RowNo > 1
)
DELETE FROM test_countries
WHERE id IN (SELECT id FROM removeDuplicates);


-- Funkcja implementująca metodę 1 oraz IF...ELSIF...ELSE:
CREATE OR REPLACE FUNCTION deleteDuplicates(tabName TEXT)
RETURNS boolean AS
$$
    DECLARE removedRows INT := 0; -- liczba usuniętych wierszy
    BEGIN
        IF tabName = 'test_countries' THEN
            DELETE FROM test_countries
            WHERE id NOT IN (
                SELECT MIN(id) FROM test_countries
                GROUP BY country_name, capital
            );

        ELSIF tabName = 'other_countries' THEN
            DELETE FROM other_countries
            WHERE id NOT IN (
                SELECT MIN(id) FROM other_countries
                GROUP BY country_name, capital
            );
        ELSE
            RAISE EXCEPTION 'Niepoprawna tabela: %', tabName;
        END IF;
        -- sprawdzanie, ile wierszy zostało usuniętych:
        GET DIAGNOSTICS removedRows = ROW_COUNT;
        RETURN removedRows > 0; -- jeśli > 0, zwraca TRUE
    END;
$$ language plpgsql;


-- Funkcja dynamiczna implementująca metodę 1:
-- UWAGA: działa wtedy, kiedy tabele mają tą samą nazwę pola ID
CREATE OR REPLACE FUNCTION deleteDuplicates(tabName TEXT)
RETURNS boolean AS
$$
DECLARE removedRows INT := 0;
BEGIN
    IF tabName NOT IN('test_countries', 'other_countries') THEN
        RAISE EXCEPTION 'Niepoprawna tabela: %', tabName;
    END IF;

    EXECUTE format('DELETE FROM %I WHERE id NOT IN (
        SELECT MIN(id) FROM %I
        GROUP BY country_name, capital
        )', tabName, tabName
    );

    GET DIAGNOSTICS removedRows = ROW_COUNT;
    RETURN removedRows > 0; 
END;
$$ LANGUAGE plpgsql;


-- Funkcja dynamiczna implementująca metodę 1:
-- w porównaniu do poprzedniej funkcji, funkcja ta
-- dodatkowo mapuje nazwy pól ID
CREATE OR REPLACE FUNCTION deleteDuplicates(tabName TEXT)
RETURNS boolean AS
$$
DECLARE removedRows INT := 0;
DECLARE idColumn TEXT;
BEGIN
    IF tabName NOT IN('test_countries', 'other_countries') THEN
        RAISE EXCEPTION 'Niepoprawna tabela: %', tabName;
    END IF;

    -- mapowanie pól ID:
    IF tabName = 'test_countries' THEN
        idColumn := 'tcid';
    ELSIF tabName = 'other_countries' THEN
        idColumn := 'ocid';
    END IF;

    EXECUTE format('DELETE FROM %I WHERE %I NOT IN (
        SELECT MIN(%I) FROM %I
        GROUP BY country_name, capital
        )', tabName, idColumn, idColumn, tabName
    );

    GET DIAGNOSTICS removedRows = ROW_COUNT;
    RETURN removedRows > 0; 
END;
$$ LANGUAGE plpgsql;

SELECT deleteDuplicates('test_countries');

BEGIN;
DROP TABLE IF EXISTS test_countries;
DROP TABLE IF EXISTS other_countries;
COMMIT;

DROP FUNCTION deleteDuplicates;
