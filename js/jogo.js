/* ================================
   CONFIGURAÇÃO
================================= */
const apiKey = "abd2a5c9a49e451eae11805160e57425";
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("id");

/* ================================
   FUNÇÃO AUXILIAR — ESTRELAS
================================= */
function notaParaPercentual(nota) {
    const v = Number(nota) || 0;
    return Math.max(0, Math.min(100, (v / 5) * 100));
}

/* ================================
   CARREGAR DADOS DO JOGO
================================= */
async function carregarJogo() {
    try {
        const resp = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
        const jogo = await resp.json();

        // TÍTULO
        document.getElementById("game-title").textContent = jogo.name || "Sem nome";

        // CAPA
        document.getElementById("game-cover").src =
            jogo.background_image || "assets/img/default-cover.png";

        // DESCRIÇÃO (proteção contra HTML feio)
        document.getElementById("game-description").innerText =
        limparDescricao(jogo.description_raw);

        function limparDescricao(desc){
         if (!desc) return "";
         return desc.replace(/https?:\/\/[^\s]+/g, ""); // remove qualquer link
        } 


        // DESENVOLVEDORES
        document.getElementById("game-devs").textContent =
            jogo.developers?.map(d => d.name).join(", ") || "Não informado";

        // PLATAFORMAS
        const platformsList = document.getElementById("game-platforms");
        platformsList.innerHTML = "";
        (jogo.platforms || []).forEach(p => {
            const li = document.createElement("li");
            li.textContent = p.platform.name;
            platformsList.appendChild(li);
        });

        // LOJAS
        gerarBotoesLojas(jogo.stores);

        // ESTRELAS
        const notaPct = notaParaPercentual(jogo.rating);
        const stars = document.createElement("div");
        stars.className = "stars";
        stars.innerHTML = `<div class="stars-fill" style="width:${notaPct}%">★★★★★</div>`;
        document.querySelector(".game-header").appendChild(stars);

        // METACRITIC
        if (jogo.metacritic) {
            const mc = document.createElement("div");
            mc.className = "mc-score";
            mc.textContent = `Metacritic: ${jogo.metacritic}`;
            document.querySelector(".game-header").appendChild(mc);
        }

        // CARREGAR RELACIONADOS
        carregarScreenshots();
        carregarTrailer();
        carregarReviews();
    } catch (e) {
        console.error("Erro ao carregar jogo:", e);
    }
}

/* ================================
   BOTÕES DE LOJAS
================================= */
function gerarBotoesLojas(stores) {
    const container = document.getElementById("store-buttons");
    container.innerHTML = "";

    if (!stores || stores.length === 0) {
        container.innerHTML = "<p>Não disponível em lojas digitais.</p>";
        return;
    }

    stores.forEach(s => {
        const url =
            s.url ||
            s.url_en ||
            (s.store?.domain ? `https://${s.store.domain}` : "#");

        const btn = document.createElement("a");
        btn.className = "loja-btn";
        btn.href = url;
        btn.target = "_blank";
        btn.rel = "noopener";
        btn.textContent = s.store?.name || "Loja";

        container.appendChild(btn);
    });
}

/* ================================
   SCREENSHOTS
================================= */
async function carregarScreenshots() {
    try {
        const resp = await fetch(
            `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`
        );
        const dados = await resp.json();

        const container = document.getElementById("screenshots-container");
        container.innerHTML = "";

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = "<p>Nenhuma screenshot encontrada.</p>";
            return;
        }

        dados.results.forEach(sh => {
            const img = document.createElement("img");
            img.src = sh.image;
            img.className = "screenshot";
            container.appendChild(img);
        });
    } catch (e) {
        console.error("Erro screenshots:", e);
    }
}

/* ================================
   TRAILER
================================= */
async function carregarTrailer() {
    try {
        const resp = await fetch(
            `https://api.rawg.io/api/games/${gameId}/movies?key=${apiKey}`
        );
        const dados = await resp.json();

        const container = document.getElementById("trailer-player");
        container.innerHTML = "";

        if (!dados.results || dados.results.length === 0) {
            container.innerHTML = "<p>Nenhum trailer disponível.</p>";
            return;
        }

        const movie = dados.results[0];
        const videoUrl =
            movie?.data?.max ||
            movie?.preview ||
            movie?.data?.["480"] ||
            null;

        if (!videoUrl) {
            container.innerHTML = "<p>Trailer não disponível.</p>";
            return;
        }

        const video = document.createElement("video");
        video.controls = true;
        video.className = "trailer-video";

        const src = document.createElement("source");
        src.src = videoUrl;
        src.type = "video/mp4";

        video.appendChild(src);
        container.appendChild(video);
    } catch (e) {
        console.error("Erro trailer:", e);
    }
}

/* ================================
   REVIEWS
================================= */
async function carregarReviews() {
    try {
        const resp = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
        const jogo = await resp.json();

        const container = document.getElementById("reviews-container");
        container.innerHTML = "";

        if (jogo.metacritic) {
            const bloco = document.createElement("div");
            bloco.className = "review";
            bloco.innerHTML = `
                <h3>Metacritic</h3>
                <p>Pontuação: ${jogo.metacritic}</p>
                ${jogo.metacritic_url ?
                `<a href="${jogo.metacritic_url}" target="_blank">Abrir no Metacritic</a>` : ""}
            `;
            container.appendChild(bloco);
        } else {
            container.innerHTML = "<p>Nenhuma review externa encontrada.</p>";
        }
    } catch (e) {
        console.error("Erro reviews:", e);
    }
}

/* ================================
   INICIAR
================================= */
carregarJogo();
