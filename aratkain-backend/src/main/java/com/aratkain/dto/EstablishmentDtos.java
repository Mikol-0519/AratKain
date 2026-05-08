package com.aratkain.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

public class EstablishmentDtos {

    // ── Establishment response (for map pins + list) ──────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EstablishmentResponse {
        private Long   establishmentId;
        private String name;
        private String description;
        private String estabType;
        private String phone;
        private String address;
        private String city;
        private Double latitude;
        private Double longitude;
        private Double averageRating;
        private Integer reviewCount;
        private Boolean isOpen;
        private Double distanceKm;   // only set for nearby searches
    }

    // ── Nearby search request ─────────────────────────────────
    @Data
    public static class NearbyRequest {

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0",  message = "Invalid latitude")
        @DecimalMax(value = "90.0",   message = "Invalid latitude")
        private Double latitude;

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Invalid longitude")
        @DecimalMax(value = "180.0",  message = "Invalid longitude")
        private Double longitude;

        // Default 10km radius
        private Double  radiusKm = 10.0;

        // Optional filter: cafe | restaurant | bar
        private String  type;

        // Max results
        private Integer limit    = 50;
    }
}