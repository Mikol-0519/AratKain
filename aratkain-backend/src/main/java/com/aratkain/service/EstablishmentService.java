package com.aratkain.service;

import com.aratkain.dto.EstablishmentDtos.*;
import com.aratkain.entity.Establishment;
import com.aratkain.repository.EstablishmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstablishmentService {

    private final EstablishmentRepository repo;

    // ── Get all establishments ────────────────────────────────
    public List<EstablishmentResponse> getAll() {
        return repo.findAllOrderByRating()
                .stream()
                .map(e -> toResponse(e, null))
                .collect(Collectors.toList());
    }

    // ── Find nearby by GPS ────────────────────────────────────
    public List<EstablishmentResponse> findNearby(NearbyRequest req) {
        double   lat      = req.getLatitude();
        double   lng      = req.getLongitude();
        double   radius   = req.getRadiusKm()  != null ? req.getRadiusKm()  : 10.0;
        int      limit    = req.getLimit()      != null ? req.getLimit()     : 50;
        String   type     = req.getType();

        List<Establishment> results;

        if (type != null && !type.isBlank()) {
            results = repo.findNearbyByType(lat, lng, radius, type, limit);
        } else {
            results = repo.findNearby(lat, lng, radius, limit);
        }

        return results.stream()
                .map(e -> toResponse(e, calcDistance(
                        lat, lng,
                        e.getLocation() != null ? e.getLocation().getLatitude()  : 0,
                        e.getLocation() != null ? e.getLocation().getLongitude() : 0
                )))
                .collect(Collectors.toList());
    }

    // ── Search by name ────────────────────────────────────────
    public List<EstablishmentResponse> search(String query) {
        return repo.findByNameContainingIgnoreCase(query)
                .stream()
                .map(e -> toResponse(e, null))
                .collect(Collectors.toList());
    }

    // ── Filter by type ────────────────────────────────────────
    public List<EstablishmentResponse> filterByType(String type) {
        return repo.findByEstabTypeIgnoreCase(type)
                .stream()
                .map(e -> toResponse(e, null))
                .collect(Collectors.toList());
    }

    // ── Get by ID ─────────────────────────────────────────────
    public EstablishmentResponse getById(Long id) {
        Establishment e = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Establishment not found"));
        return toResponse(e, null);
    }

    // ── Helpers ───────────────────────────────────────────────
    private EstablishmentResponse toResponse(Establishment e, Double distanceKm) {
        Double lat = e.getLocation() != null ? e.getLocation().getLatitude()  : null;
        Double lng = e.getLocation() != null ? e.getLocation().getLongitude() : null;

        return EstablishmentResponse.builder()
                .establishmentId(e.getEstablishmentId())
                .name(e.getName())
                .description(e.getDescription())
                .estabType(e.getEstabType())
                .phone(e.getPhone())
                .address(e.getAddress())
                .city(e.getCity())
                .latitude(lat)
                .longitude(lng)
                .averageRating(e.getAverageRating())
                .reviewCount(e.getReviewCount())
                .isOpen(e.getIsOpen())
                .distanceKm(distanceKm != null ?
                        Math.round(distanceKm * 100.0) / 100.0 : null)
                .build();
    }

    private double calcDistance(double lat1, double lng1,
                                double lat2, double lng2) {
        final double R    = 6371;
        double       dLat = Math.toRadians(lat2 - lat1);
        double       dLng = Math.toRadians(lng2 - lng1);
        double       a    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}