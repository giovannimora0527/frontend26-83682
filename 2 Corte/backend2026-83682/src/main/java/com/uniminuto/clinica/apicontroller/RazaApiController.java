package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.RazaApi;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.service.RazaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RazaApiController implements RazaApi {

    private final RazaService razaService;

    @Override
    public ResponseEntity<List<Raza>> listarRazas() {
        return ResponseEntity.ok(razaService.listarRazas());
    }
}
