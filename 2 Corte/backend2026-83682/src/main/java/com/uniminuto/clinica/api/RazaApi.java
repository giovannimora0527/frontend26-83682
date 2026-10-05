package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Raza;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/raza")
public interface RazaApi {

    @GetMapping(value = "/listar", produces = "application/json")
    ResponseEntity<List<Raza>> listarRazas();
}
