-- Atallas a tobb mentett cimrol (addresses tabla) a felhasznalonkenti egy cimre.
-- Csak egyszer kell lefuttatni, egy mar letezo pizza_napoli adatbazison.

ALTER TABLE users
  ADD COLUMN delivery_postal_code VARCHAR(10) NULL AFTER phone,
  ADD COLUMN delivery_city VARCHAR(100) NULL AFTER delivery_postal_code,
  ADD COLUMN delivery_street_address VARCHAR(255) NULL AFTER delivery_city;

UPDATE users u
JOIN addresses a ON a.user_id = u.id AND a.is_default = TRUE
SET u.delivery_postal_code = a.postal_code,
    u.delivery_city = a.city,
    u.delivery_street_address = a.street_address;

DROP TABLE addresses;
