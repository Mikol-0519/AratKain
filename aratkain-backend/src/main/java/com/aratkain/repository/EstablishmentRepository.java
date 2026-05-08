package com.aratkain.repository;

import com.aratkain.entity.Establishment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstablishmentRepository extends JpaRepository<Establishment, Long> {

    // ── Find all nearby using Haversine formula ───────────────
    @Query(value = """
        SELECT e.*,
               (6371 * acos(
                   cos(radians(:lat)) * cos(radians(l.latitude)) *
                   cos(radians(l.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(l.latitude))
               )) AS distance_km
        FROM establishments e
        JOIN location l ON e.establishment_id = l.establishment_id
        WHERE (6371 * acos(
                   cos(radians(:lat)) * cos(radians(l.latitude)) *
                   cos(radians(l.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(l.latitude))
               )) <= :radiusKm
        ORDER BY distance_km ASC
        LIMIT :limitVal
        """, nativeQuery = true)
    List<Establishment> findNearby(
            @Param("lat")      double lat,
            @Param("lng")      double lng,
            @Param("radiusKm") double radiusKm,
            @Param("limitVal") int    limit
    );

    // ── Find nearby filtered by type ──────────────────────────
    @Query(value = """
        SELECT e.*,
               (6371 * acos(
                   cos(radians(:lat)) * cos(radians(l.latitude)) *
                   cos(radians(l.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(l.latitude))
               )) AS distance_km
        FROM establishments e
        JOIN location l ON e.establishment_id = l.establishment_id
        WHERE LOWER(e.estab_type) = LOWER(:type)
          AND (6371 * acos(
                   cos(radians(:lat)) * cos(radians(l.latitude)) *
                   cos(radians(l.longitude) - radians(:lng)) +
                   sin(radians(:lat)) * sin(radians(l.latitude))
               )) <= :radiusKm
        ORDER BY distance_km ASC
        LIMIT :limitVal
        """, nativeQuery = true)
    List<Establishment> findNearbyByType(
            @Param("lat")      double lat,
            @Param("lng")      double lng,
            @Param("radiusKm") double radiusKm,
            @Param("type")     String type,
            @Param("limitVal") int    limit
    );

    // ── Search by name ────────────────────────────────────────
    List<Establishment> findByNameContainingIgnoreCase(String name);

    // ── Filter by type ────────────────────────────────────────
    List<Establishment> findByEstabTypeIgnoreCase(String type);

    // ── Get all ───────────────────────────────────────────────
    @Query("SELECT e FROM Establishment e ORDER BY e.averageRating DESC")
    List<Establishment> findAllOrderByRating();
}