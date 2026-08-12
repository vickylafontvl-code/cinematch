import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://tjkxzrfvuctyuhdvmbvd.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_uUE4CGTuDw4NTQsjfwkZzQ_BtRkyh85";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// =====================================================
// USUARIOS
// =====================================================

const VICTORIA_ID =
  "8b1ae039-809c-4b3d-b389-5303a40dd9c1";

const AXEL_ID =
  "79dd99d1-11f0-40cb-9c22-3c5a0e6d0006";


let currentUserId =
  localStorage.getItem("cinematch_user_id");

let currentMovie = null;


// =====================================================
// ELEMENTOS
// =====================================================

const movieCount =
  document.getElementById("movie-count");

const shuffleButton =
  document.getElementById("shuffle-button");

const movieResult =
  document.getElementById("movie-result");

const currentUser =
  document.getElementById("current-user");

const watchedCount =
  document.getElementById("watched-count");

const watchedCountHeading =
  document.getElementById("watched-count-heading");

const watchedMovies =
  document.getElementById("watched-movies");

const changeUserButton =
  document.getElementById("change-user-button");


// =====================================================
// UTILIDADES
// =====================================================

function escapeHTML(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getPosterURL(movie) {
  if (
    !movie ||
    !movie.poster_url
  ) {
    return "";
  }

  return String(
    movie.poster_url
  ).trim();
}


function getLetterboxdURL(movie) {
  if (
    !movie ||
    !movie.letterboxd_url
  ) {
    return "";
  }

  return String(
    movie.letterboxd_url
  ).trim();
}


function getPosterHTML(
  movie,
  large = false
) {
  const poster =
    getPosterURL(movie);

  const title =
    escapeHTML(
      movie?.title || "Película"
    );

  const className =
    large
      ? "movie-poster-large"
      : "movie-poster";


  if (!poster) {
    return `
      <div
        class="${className} poster-placeholder"
      >
        <div
          class="poster-placeholder-icon"
          aria-hidden="true"
        >
          🎬
        </div>

        <span>
          ${title}
        </span>
      </div>
    `;
  }


  return `
    <img
      class="${className}"
      src="${escapeHTML(poster)}"
      alt="Poster de ${title}"
      loading="lazy"
      onerror="this.style.display='none';"
    >
  `;
}


function getDefaultShuffleButtonHTML(
  text = "Sortear película"
) {
  return `
    <span class="button-circle">
      <span
        class="play-icon"
        aria-hidden="true"
      >
        ▶
      </span>
    </span>

    <span>
      ${escapeHTML(text)}
    </span>

    <span
      class="button-arrow"
      aria-hidden="true"
    >
      →
    </span>
  `;
}


function showError(
  title,
  message
) {
  movieResult.innerHTML = `
    <div class="error-card">

      <strong>
        ${escapeHTML(title)}
      </strong>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>
  `;
}


// =====================================================
// USUARIO
// =====================================================

function showUserSelector() {
  movieResult.innerHTML = `
    <div class="user-selector">

      <div class="section-eyebrow">
        CINE MATCH
      </div>

      <h2>
        ¿Quién sos?
      </h2>

      <p>
        Elegí quién está usando CineMatch.
      </p>

      <button
        id="victoria-button"
        type="button"
      >
        ❤️ Victoria
      </button>

      <button
        id="axel-button"
        type="button"
      >
        💙 Axel
      </button>

    </div>
  `;


  document
    .getElementById("victoria-button")
    ?.addEventListener(
      "click",
      () => {
        selectUser(VICTORIA_ID);
      }
    );


  document
    .getElementById("axel-button")
    ?.addEventListener(
      "click",
      () => {
        selectUser(AXEL_ID);
      }
    );
}


function selectUser(userId) {
  currentUserId = userId;

  localStorage.setItem(
    "cinematch_user_id",
    userId
  );

  updateUserDisplay();


  movieResult.innerHTML = `
    <div class="empty-result">

      <div
        class="empty-result-symbol"
        aria-hidden="true"
      >
        ✓
      </div>

      <div class="empty-result-content">

        <div class="section-eyebrow">
          LISTO
        </div>

        <h2>
          Usuario seleccionado.
        </h2>

        <p>
          Ahora pueden sortear una película.
        </p>

      </div>

    </div>
  `;


  loadWatchedMovies();
}


function updateUserDisplay() {
  if (currentUserId === VICTORIA_ID) {

    currentUser.textContent =
      "❤️ Victoria";

    return;
  }


  if (currentUserId === AXEL_ID) {

    currentUser.textContent =
      "💙 Axel";

    return;
  }


  currentUser.textContent =
    "No seleccionado";
}


changeUserButton?.addEventListener(
  "click",
  () => {

    localStorage.removeItem(
      "cinematch_user_id"
    );

    currentUserId = null;

    updateUserDisplay();

    showUserSelector();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
);


// =====================================================
// CANTIDAD DE PELÍCULAS
// =====================================================

async function loadMovies() {
  const {
    data,
    error
  } = await supabase
    .from("movies")
    .select("id")
    .eq("status", "pending");


  if (error) {

    console.error(
      "Error cargando películas:",
      error
    );

    if (movieCount) {
      movieCount.textContent = "—";
    }

    return;
  }


  if (movieCount) {
    movieCount.textContent =
      data?.length ?? 0;
  }
}


// =====================================================
// SORTEAR PELÍCULA
// =====================================================

async function shuffleMovie() {

  if (!currentUserId) {
    showUserSelector();
    return;
  }


  if (!shuffleButton) {
    return;
  }


  shuffleButton.disabled = true;

  shuffleButton.innerHTML = `
    <span>
      🎲 Sorteando…
    </span>
  `;


  movieResult.innerHTML = `
    <div class="empty-result">

      <div
        class="empty-result-symbol"
        aria-hidden="true"
      >
        🎲
      </div>

      <div class="empty-result-content">

        <div class="section-eyebrow">
          CINEMATCH
        </div>

        <h2>
          Buscando una película…
        </h2>

        <p>
          Un momento.
        </p>

      </div>

    </div>
  `;


  const {
    data,
    error
  } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "pending");


  if (error) {

    console.error(
      "Error sorteando película:",
      error
    );

    showError(
      "No se pudo cargar",
      "Hubo un problema al cargar las películas."
    );

    shuffleButton.disabled = false;

    shuffleButton.innerHTML =
      getDefaultShuffleButtonHTML();

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    movieResult.innerHTML = `
      <div class="empty-result">

        <div
          class="empty-result-symbol"
          aria-hidden="true"
        >
          🎬
        </div>

        <div class="empty-result-content">

          <div class="section-eyebrow">
            FIN DE LA LISTA
          </div>

          <h2>
            No quedan películas.
          </h2>

          <p>
            Ya vimos todas las películas pendientes.
          </p>

        </div>

      </div>
    `;

    shuffleButton.disabled = false;

    shuffleButton.innerHTML =
      getDefaultShuffleButtonHTML(
        "Sortear película"
      );

    return;
  }


  currentMovie =
    data[
      Math.floor(
        Math.random() * data.length
      )
    ];


  await showMovie();


  shuffleButton.disabled = false;

  shuffleButton.innerHTML =
    getDefaultShuffleButtonHTML(
      "Sortear otra"
    );
}


// =====================================================
// OBTENER RATINGS
// =====================================================

async function getMovieRatings(
  movieId
) {
  const {
    data,
    error
  } = await supabase
    .from("ratings")
    .select("*")
    .eq(
      "movie_id",
      movieId
    );


  if (error) {

    console.error(
      "Error cargando ratings:",
      error
    );

    return [];
  }


  return data ?? [];
}


function getRatingForUser(
  ratings,
  userId
) {
  return ratings.find(
    rating =>
      rating.user_id === userId
  );
}


function calculateAverage(
  victoriaRating,
  axelRating
) {
  if (
    !victoriaRating ||
    !axelRating
  ) {
    return null;
  }


  return (
    Number(victoriaRating.score) +
    Number(axelRating.score)
  ) / 2;
}


// =====================================================
// MOSTRAR PELÍCULA
// =====================================================

async function showMovie() {

  if (!currentMovie) {
    return;
  }


  const ratings =
    await getMovieRatings(
      currentMovie.id
    );


  const victoriaRating =
    getRatingForUser(
      ratings,
      VICTORIA_ID
    );


  const axelRating =
    getRatingForUser(
      ratings,
      AXEL_ID
    );


  const myRating =
    getRatingForUser(
      ratings,
      currentUserId
    );


  const average =
    calculateAverage(
      victoriaRating,
      axelRating
    );


  const title =
    escapeHTML(
      currentMovie.title
    );


  const year =
    escapeHTML(
      currentMovie.year ?? ""
    );


  let status;


  if (
    currentMovie.status ===
    "pending"
  ) {

    status =
      "Aún no la miraron";

  } else if (
    currentMovie.status ===
    "watched"
  ) {

    status =
      "Ya la miraron";

  } else {

    status =
      escapeHTML(
        currentMovie.status ?? ""
      );
  }


  const letterboxdURL =
    getLetterboxdURL(
      currentMovie
    );


  const posterHTML =
    getPosterHTML(
      currentMovie,
      true
    );


  movieResult.innerHTML = `
    <div class="movie-card-featured">

      <div class="movie-featured-layout">

        <div class="movie-featured-poster">

          ${
            letterboxdURL
              ? `
                <a
                  href="${escapeHTML(letterboxdURL)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir ${title} en Letterboxd"
                >
                  ${posterHTML}
                </a>
              `
              : posterHTML
          }

        </div>


        <div class="movie-featured-info">

          <span class="movie-badge">
            PELÍCULA SORTEADA
          </span>


          <h2>
            ${title}
          </h2>


          ${
            year
              ? `
                <p class="movie-year">
                  ${year}
                </p>
              `
              : ""
          }


          <p class="movie-status">
            Estado:

            <strong>
              ${status}
            </strong>
          </p>


          ${
            currentMovie.status === "pending"
              ? `
                <button
                  id="watched-button"
                  type="button"
                >
                  ✓ La vimos
                </button>
              `
              : `
                <p class="already-watched">
                  ✓ Ya la vimos
                </p>
              `
          }


          ${
            letterboxdURL
              ? `
                <a
                  class="letterboxd-button"
                  href="${escapeHTML(letterboxdURL)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en Letterboxd ↗
                </a>
              `
              : ""
          }

        </div>

      </div>


      <hr>


      <div class="ratings-section">

        <h3>
          ⭐ Puntajes
        </h3>


        <div class="rating-row">

          <span>
            ❤️ Victoria
          </span>

          <strong>
            ${
              victoriaRating
                ? escapeHTML(
                    victoriaRating.score
                  )
                : "—"
            }
          </strong>

        </div>


        <div class="rating-row">

          <span>
            💙 Axel
          </span>

          <strong>
            ${
              axelRating
                ? escapeHTML(
                    axelRating.score
                  )
                : "—"
            }
          </strong>

        </div>


        ${
          average !== null
            ? `
              <div class="average-rating">

                <span>
                  ⭐ Promedio
                </span>

                <strong>
                  ${average.toFixed(2)}
                </strong>

              </div>
            `
            : ""
        }

      </div>


      <hr>


      <div class="your-rating">

        <h3>
          Tu puntuación
        </h3>


        <select id="score-select">

          <option value="">
            Elegí una nota
          </option>

          ${Array.from(
            { length: 21 },
            (_, index) => {

              const score =
                index / 2;

              const selected =
                myRating &&
                Number(
                  myRating.score
                ) === score
                  ? "selected"
                  : "";

              return `
                <option
                  value="${score}"
                  ${selected}
                >
                  ${score}
                </option>
              `;
            }
          ).join("")}

        </select>


        <button
          id="save-rating-button"
          type="button"
        >
          ⭐ Guardar puntuación
        </button>

      </div>

    </div>
  `;


  document
    .getElementById("watched-button")
    ?.addEventListener(
      "click",
      markAsWatched
    );


  document
    .getElementById("save-rating-button")
    ?.addEventListener(
      "click",
      saveRating
    );
}


// =====================================================
// MARCAR COMO VISTA
// =====================================================

async function markAsWatched() {

  if (!currentMovie) {
    return;
  }


  const watchedButton =
    document.getElementById(
      "watched-button"
    );


  if (!watchedButton) {
    return;
  }


  watchedButton.disabled = true;

  watchedButton.textContent =
    "Guardando…";


  const {
    error
  } = await supabase
    .from("movies")
    .update({
      status: "watched"
    })
    .eq(
      "id",
      currentMovie.id
    );


  if (error) {

    console.error(
      "Error actualizando película:",
      error
    );

    watchedButton.disabled = false;

    watchedButton.textContent =
      "❌ Error. Intentar de nuevo";

    return;
  }


  currentMovie.status =
    "watched";


  await showMovie();

  await Promise.all([
    loadWatchedMovies(),
    loadMovies()
  ]);
}


// =====================================================
// GUARDAR PUNTUACIÓN
// =====================================================

async function saveRating() {

  if (!currentMovie) {
    return;
  }


  if (!currentUserId) {
    showUserSelector();
    return;
  }


  const select =
    document.getElementById(
      "score-select"
    );


  if (!select) {
    return;
  }


  const score =
    select.value;


  if (score === "") {

    alert(
      "Elegí una puntuación primero."
    );

    return;
  }


  const saveButton =
    document.getElementById(
      "save-rating-button"
    );


  if (!saveButton) {
    return;
  }


  saveButton.disabled = true;

  saveButton.textContent =
    "Guardando…";


  const {
    data: existingRating,
    error: findError
  } = await supabase
    .from("ratings")
    .select("*")
    .eq(
      "movie_id",
      currentMovie.id
    )
    .eq(
      "user_id",
      currentUserId
    )
    .maybeSingle();


  if (findError) {

    console.error(
      "Error buscando puntuación:",
      findError
    );

    saveButton.disabled = false;

    saveButton.textContent =
      "⭐ Guardar puntuación";

    return;
  }


  let error = null;


  if (existingRating) {

    const result =
      await supabase
        .from("ratings")
        .update({
          score: Number(score),
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          existingRating.id
        );


    error =
      result.error;

  } else {

    const result =
      await supabase
        .from("ratings")
        .insert({
          movie_id:
            currentMovie.id,

          user_id:
            currentUserId,

          score:
            Number(score)
        });


    error =
      result.error;
  }


  if (error) {

    console.error(
      "Error guardando puntuación:",
      error
    );

    saveButton.disabled = false;

    saveButton.textContent =
      "❌ Error. Intentar de nuevo";

    return;
  }


  await showMovie();

  await loadWatchedMovies();
}


// =====================================================
// PELÍCULAS VISTAS
// =====================================================

async function loadWatchedMovies() {

  if (!watchedMovies) {
    return;
  }


  watchedMovies.innerHTML = `
    <div class="loading-card">
      Cargando películas vistas…
    </div>
  `;


  const {
    data: movies,
    error
  } = await supabase
    .from("movies")
    .select(
      `
        id,
        title,
        year,
        poster_url,
        letterboxd_url,
        status
      `
    )
    .eq(
      "status",
      "watched"
    )
    .order(
      "title",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Error cargando películas vistas:",
      error
    );


    watchedMovies.innerHTML = `
      <div class="loading-card">

        ❌ No se pudieron cargar
        las películas vistas.

      </div>
    `;

    return;
  }


  if (
    !movies ||
    movies.length === 0
  ) {

    updateWatchedCount(0);


    watchedMovies.innerHTML = `
      <div class="loading-card">

        🎬 Todavía no vimos
        ninguna película.

      </div>
    `;

    return;
  }


  updateWatchedCount(
    movies.length
  );


  const movieIds =
    movies.map(
      movie => movie.id
    );


  const {
    data: ratingData,
    error: ratingsError
  } = await supabase
    .from("ratings")
    .select("*")
    .in(
      "movie_id",
      movieIds
    );


  const ratings =
    !ratingsError &&
    ratingData
      ? ratingData
      : [];


  watchedMovies.innerHTML =
    movies
      .map(
        movie =>
          renderWatchedCard(
            movie,
            ratings
          )
      )
      .join("");


  document
    .querySelectorAll(
      ".rate-movie-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const movieId =
            button.dataset.movieId;


          const movie =
            movies.find(
              item =>
                String(item.id) ===
                String(movieId)
            );


          if (!movie) {
            return;
          }


          currentMovie =
            movie;


          showMovie();


          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      );

    });
}


function updateWatchedCount(
  count
) {
  if (watchedCount) {
    watchedCount.textContent =
      count;
  }

  if (watchedCountHeading) {
    watchedCountHeading.textContent =
      count;
  }
}


function renderWatchedCard(
  movie,
  ratings
) {

  const movieRatings =
    ratings.filter(
      rating =>
        String(
          rating.movie_id
        ) ===
        String(movie.id)
    );


  const victoriaRating =
    getRatingForUser(
      movieRatings,
      VICTORIA_ID
    );


  const axelRating =
    getRatingForUser(
      movieRatings,
      AXEL_ID
    );


  const average =
    calculateAverage(
      victoriaRating,
      axelRating
    );


  const title =
    escapeHTML(
      movie.title
    );


  const year =
    escapeHTML(
      movie.year ?? ""
    );


  const poster =
    getPosterURL(movie);


  const letterboxd =
    getLetterboxdURL(movie);


  const safeBackground =
    poster
      ? escapeHTML(
          poster.replace(
            /'/g,
            "%27"
          )
        )
      : "";


  return `
    <article
      class="watched-card"

      ${
        poster
          ? `
            style="
              background-image:
                url('${safeBackground}');
            "
          `
          : ""
      }
    >

      <div
        class="watched-card-overlay"
        aria-hidden="true"
      ></div>


      <div
        class="watched-card-content"
      >

        ${
          !poster
            ? `
              <div
                class="watched-no-poster"
                aria-hidden="true"
              >
                🎬
              </div>
            `
            : ""
        }


        <h3>
          ${title}
        </h3>


        ${
          year
            ? `
              <p>
                ${year}
              </p>
            `
            : ""
        }


        <div
          class="watched-ratings"
        >

          <span>
            ❤️
            ${
              victoriaRating
                ? escapeHTML(
                    victoriaRating.score
                  )
                : "—"
            }
          </span>


          <span>
            💙
            ${
              axelRating
                ? escapeHTML(
                    axelRating.score
                  )
                : "—"
            }
          </span>


          ${
            average !== null
              ? `
                <span
                  class="card-average"
                >
                  ⭐
                  ${average.toFixed(1)}
                </span>
              `
              : ""
          }

        </div>


        <button
          class="rate-movie-button"
          data-movie-id="${escapeHTML(movie.id)}"
          type="button"
        >
          ⭐ Puntuar
        </button>


        ${
          letterboxd
            ? `
              <a
                class="card-letterboxd"
                href="${escapeHTML(letterboxd)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Letterboxd ↗
              </a>
            `
            : ""
        }

      </div>

    </article>
  `;
}


// =====================================================
// INICIO
// =====================================================

if (shuffleButton) {

  shuffleButton.addEventListener(
    "click",
    shuffleMovie
  );
}


async function initializeApp() {

  updateUserDisplay();


  await Promise.all([
    loadMovies(),
    loadWatchedMovies()
  ]);


  if (!currentUserId) {
    showUserSelector();
  }
}


initializeApp();


// =====================================================
// SERVICE WORKER
// =====================================================

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register(
          "./service-worker.js"
        )
        .then(() => {

          console.log(
            "CineMatch: Service Worker registrado."
          );

        })
        .catch(error => {

          console.error(
            "CineMatch: error al registrar el Service Worker:",
            error
          );

        });

    }
  );
}
