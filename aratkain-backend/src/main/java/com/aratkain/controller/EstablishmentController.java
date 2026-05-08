package com.aratkain.controller;

import com.aratkain.dto.EstablishmentDtos.*;
import com.aratkain.service.EstablishmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/establishments")
@RequiredArgsConstructor
public class EstablishmentController {

    private final EstablishmentService service;

    // GET /api/establishments — all establishments
    @GetMapping
    public ResponseEntity<List<EstablishmentResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // GET /api/establishments/{id} — single establishment
    @GetMapping("/{id}")
    public ResponseEntity<EstablishmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // POST /api/establishments/nearby — find by GPS location
    @PostMapping("/nearby")
    public ResponseEntity<List<EstablishmentResponse>> findNearby(
            @Valid @RequestBody NearbyRequest request) {
        return ResponseEntity.ok(service.findNearby(request));
    }

    // GET /api/establishments/search?q=coffee — search by name
    @GetMapping("/search")
    public ResponseEntity<List<EstablishmentResponse>> search(
            @RequestParam String q) {
        return ResponseEntity.ok(service.search(q));
    }

    // GET /api/establishments/type/cafe — filter by type
    @GetMapping("/type/{type}")
    public ResponseEntity<List<EstablishmentResponse>> filterByType(
            @PathVariable String type) {
        return ResponseEntity.ok(service.filterByType(type));
    }
}