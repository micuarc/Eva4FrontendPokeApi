import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Container,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { Typeahead } from "react-bootstrap-typeahead";
import "./PokemonFetcher.css";

const BadgeTipo = ({ tipo }) => {
  const clase = tipo.toLowerCase().replace(/\s+/g, "");
  return <span className={`badge-tipo ${clase}`}>{tipo}</span>;
};

const PokemonFetcher = () => {
  const [pokemones, setPokemones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [pokemonSeleccionado, setPokemonSeleccionado] = useState(null);

  const traduccionesStats = {
    hp: "HP",
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "Ataque Especial",
    "special-defense": "Defensa Especial",
    speed: "Velocidad",
  };

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await fetch("https://pokeapi.co/api/v2/type");
        const data = await response.json();

        const tiposConNombre = await Promise.all(
          data.results.map(async (tipo) => {
            const resTipo = await fetch(tipo.url);
            const dataTipo = await resTipo.json();
            const nombreES = dataTipo.names.find(
              (n) => n.language.name === "es"
            );
            return {
              nombre: nombreES ? nombreES.name : tipo.name,
              nombreAPI: tipo.name,
              url: tipo.url,
            };
          })
        );

        const tiposFiltrados = tiposConNombre.filter(
          (tipo) =>
            tipo.nombreAPI !== "unknown" &&
            tipo.nombreAPI !== "shadow" &&
            tipo.nombreAPI !== "stellar"
        );

        setTipos(tiposFiltrados);
      } catch (err) {
        setError("Error al cargar los tipos.");
      }
    };

    fetchTipos();
  }, []);

  useEffect(() => {
    const fetchPorTipo = async () => {
      if (seleccionado.length === 0) return;

      setCargando(true);
      setError(null);

      try {
        const tipoSeleccionado = seleccionado[0];
        const response = await fetch(tipoSeleccionado.url);
        const data = await response.json();

        const listaPokemones = data.pokemon.map((p) => p.pokemon);
        const mezclados = listaPokemones
          .sort(() => 0.5 - Math.random())
          .slice(0, 25);

        const detalles = await Promise.all(
          mezclados.map(async (poke) => {
            const res = await fetch(poke.url);
            const data = await res.json();

            const nombreES = data.names?.find(
              (n) => n.language.name === "es"
            )?.name;
            const tiposEspaniol = await Promise.all(
              data.types.map(async (typeInfo) => {
                const responseTipo = await fetch(typeInfo.type.url);
                const dataTipo = await responseTipo.json();
                const nombreEspaniol = dataTipo.names.find(
                  (n) => n.language.name === "es"
                );
                return nombreEspaniol
                  ? nombreEspaniol.name
                  : typeInfo.type.name;
              })
            );

            return {
              id: data.id,
              nombre: (nombreES || data.name).split("-")[0],
              imagen: data.sprites.front_default,
              tipos: tiposEspaniol,
              stats: data.stats.map((s) => ({
                nombre: s.stat.name,
                valor: s.base_stat,
              })),
            };
          })
        );

        const detallesUnicos = detalles
          .filter(
            (poke, index, self) =>
              index === self.findIndex((p) => p.nombre === poke.nombre)
          )
          .slice(0, 12);

        setPokemones(detallesUnicos);
      } catch (err) {
        setError("¡ERROR AL CARGAR POKÉMONES!");
      } finally {
        setCargando(false);
      }
    };

    fetchPorTipo();
  }, [seleccionado]);

  return (
    <div className="pokemon-bg">
      <Container className="pokemon-container py-4">
        <h1 className="d-flex justify-content-center nombrePokemon pb-4">
          PokéFinder
        </h1>
        <div className="px-5 d-flex justify-content-center">
          <Form.Group>
            <Form.Label className="text-white fs-6 d-flex justify-content-center">
              Búsqueda por tipo
            </Form.Label>
            <Typeahead
              id="typeahead"
              labelKey="nombre"
              onChange={setSeleccionado}
              options={tipos}
              placeholder="Escribe un tipo..."
              selected={seleccionado}
              clearButton
            />
          </Form.Group>
        </div>
        {cargando && (
          <div className="spinner-overlay">
            <Spinner animation="border" variant="light" />
          </div>
        )}
        {error && <p className="text-danger mt-3">{error}</p>}

        <Row className="pokemon-list mt-4 gy-3 gx-0">
          {pokemones.map((pokemon) => (
            <Col
              key={pokemon.id}
              xs={12}
              sm={6}
              md={4}
              lg={3}
              className="mb-4 d-flex justify-content-center"
            >
              <div
                className="pokemon-card"
                onClick={() => setPokemonSeleccionado(pokemon)}
              >
                <h5 className="nombrePokemon">
                  {pokemon.nombre.charAt(0).toUpperCase() +
                    pokemon.nombre.slice(1)}
                </h5>
                <img src={pokemon.imagen} alt={pokemon.nombre} />
                <div>
                  {pokemon.tipos.map((tipo) => (
                    <BadgeTipo key={tipo} tipo={tipo} />
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Modal
          show={pokemonSeleccionado !== null}
          onHide={() => setPokemonSeleccionado(null)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title className="nombrePokemon">
              {pokemonSeleccionado?.nombre.charAt(0).toUpperCase() +
                pokemonSeleccionado?.nombre.slice(1)}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {pokemonSeleccionado && (
              <div className="modal-content-wrapper">
                <div className="modal-left">
                  <img
                    src={pokemonSeleccionado.imagen}
                    alt={pokemonSeleccionado.nombre}
                    className="pokemon-modal-img"
                  />
                  <div className="pokemon-modal-tipos">
                    {pokemonSeleccionado.tipos.map((tipo) => (
                      <BadgeTipo key={tipo} tipo={tipo} />
                    ))}
                  </div>
                </div>
                <div className="modal-right px-3">
                  <h5 className="nombrePokemon pb-3">Estadísticas</h5>
                  <ul className="modal-stats-list">
                    {pokemonSeleccionado.stats
                      .filter((s) => traduccionesStats[s.nombre])
                      .map((s, i) => (
                        <li key={i}>
                          {traduccionesStats[s.nombre]}:{" "}
                          <p className="valorPoke">{s.valor}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => setPokemonSeleccionado(null)}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default PokemonFetcher;
