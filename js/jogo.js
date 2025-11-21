const apiKey = "abd2a5c9a49e451eae11805160e57425";
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("id");

/* ================================
   FUNÇÃO AUXILIAR — ESTRELAS
================================== */
function notaParaPercentual(nota) {
    const v = Number(nota) || 0;
    return Math.max(0, Math.min(100, (v / 5) * 100));
}

/* ================================
   CARREGAR DADOS DO JOGO
================================== */
async function carregarJogo() {
    try {
        const resp = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
        const jogo = await resp.json();

        document.getElementById("game-title").textContent = jogo.name || "Sem nome";

        document.getElementById("game-cover").src =
            jogo.background_image || "assets/img/default-cover.png";

        const descElement = document.getElementById("game-description");
        descElement.innerText = limparDescricao(jogo.description_raw);

        function limparDescricao(desc) {
            if (!desc) {
                descElement.style.display = 'none'; // Esconde a caixa se não houver descrição
                return "";
            }
            return desc.replace(/https?:\/\/[^\s]+/g, ""); // remove links
        }

        document.getElementById("game-devs").textContent =
            jogo.developers?.map(d => d.name).join(", ") || "Não informado";

        const platformsList = document.getElementById("game-platforms");
        platformsList.innerHTML = "";
        (jogo.platforms || []).forEach(p => {
            const li = document.createElement("li");
            li.textContent = p.platform.name;
            platformsList.appendChild(li);
        });

        gerarBotoesLojas(jogo.stores); // Mantém a geração de botões
        exibirAvaliacoes(jogo); // Nova função para lidar com todas as notas

        // Configura os botões de "Mostrar mais/menos"
        criarBotaoExpansivel('game-description', 'desc-expanded');
        criarBotaoExpansivel('game-devs', 'devs-expanded');

        carregarScreenshots();
        carregarTrailer();
        carregarReviews();

    } catch (e) {
        console.error("Erro ao carregar jogo:", e);
    }
}

/* ================================
   EXIBIR AVALIAÇÕES
================================== */
function exibirAvaliacoes(jogo) {
    const container = document.getElementById('ratings-container');
    container.innerHTML = '';

    // 1. Nota Geral (Estrelas)
    const notaPct = notaParaPercentual(jogo.rating);
    const starsHTML = `
        <div class="rating-item">
            <span class="rating-label">Nota Geral</span>
            <div class="stars">
                <div class="stars-fill" style="width:${notaPct}%">★★★★★</div>
            </div>
            <span class="rating-value">${jogo.rating.toFixed(1)} / 5.0</span>
        </div>
    `;
    container.innerHTML += starsHTML;

    // 2. Metacritic
    if (jogo.metacritic) {
        const metacriticHTML = `
            <div class="rating-item">
                <span class="rating-label">Metacritic</span>
                <div class="mc-score">${jogo.metacritic}</div>
            </div>
        `;
        container.innerHTML += metacriticHTML;
    }

    // 3. Detalhamento das notas da comunidade RAWG
    (jogo.ratings || []).forEach(rating => {
        const ratingDetailHTML = `
            <div class="rating-item">
                <span class="rating-label">${rating.title.charAt(0).toUpperCase() + rating.title.slice(1)}</span>
                <span class="rating-value">${rating.count} votos (${rating.percent}%)</span>
            </div>`;
        container.innerHTML += ratingDetailHTML;
    });
}

/* ================================
   BOTÃO EXPANSÍVEL (MOSTRAR MAIS/MENOS)
================================== */
function criarBotaoExpansivel(elementId, expandedClass) {
    const detailsContainer = document.querySelector('.game-details');
    const textElement = document.getElementById(elementId);

    if (!textElement) return;

    // Verifica se o texto é maior que a caixa
    if (textElement.scrollHeight > textElement.clientHeight) {
        const btn = document.createElement('button');
        btn.textContent = 'Mostrar mais';
        btn.className = 'btn-show-more';
        
        // Insere o botão logo após a descrição
        textElement.parentNode.insertBefore(btn, textElement.nextSibling);

        btn.addEventListener('click', () => {
            // Alterna a classe 'expanded' no container
            detailsContainer.classList.toggle(expandedClass);

            // Atualiza o texto do botão com base na classe
            if (detailsContainer.classList.contains(expandedClass)) {
                btn.textContent = 'Mostrar menos';
            } else {
                btn.textContent = 'Mostrar mais';
            }
        });
    }
}

/* ================================
   BOTÕES DE LOJAS
================================== */
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
   SCREENSHOTS + LIGHTBOX
================================== */
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
================================== */
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
   SCREENSHOTS + LIGHTBOX (COM SETAS)
================================== */
let screenshots = [];
let indexAtual = 0;

async function carregarScreenshots() {
    try {
        const resp = await fetch(
            `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`
        );
        const dados = await resp.json();

        const container = document.getElementById("screenshots-container");
        container.innerHTML = "";

        screenshots = dados.results || [];

        if (screenshots.length === 0) {
            container.innerHTML = "<p>Nenhuma screenshot encontrada.</p>";
            return;
        }

        screenshots.forEach((sh, i) => {
            const img = document.createElement("img");
            img.src = sh.image;
            img.className = "screenshot";

            img.addEventListener("click", () => abrirLightbox(i));

            container.appendChild(img);
        });

    } catch (e) {
        console.error("Erro screenshots:", e);
    }
}

/* Abrir imagem selecionada */
function abrirLightbox(i) {
    indexAtual = i;
    document.getElementById("lightbox-img").src = screenshots[indexAtual].image;
    document.getElementById("lightbox").classList.remove("hide");
}

/* Fechar lightbox */
function fecharLightbox() {
    document.getElementById("lightbox").classList.add("hide");
}

/* Passar para a próxima imagem */
function proxima() {
    indexAtual = (indexAtual + 1) % screenshots.length;
    document.getElementById("lightbox-img").src = screenshots[indexAtual].image;
}

/* Voltar para a imagem anterior */
function anterior() {
    indexAtual = (indexAtual - 1 + screenshots.length) % screenshots.length;
    document.getElementById("lightbox-img").src = screenshots[indexAtual].image;
}

function registrarEventosLightbox() {
    document.getElementById("lightbox-next").addEventListener("click", proxima);
    document.getElementById("lightbox-prev").addEventListener("click", anterior);
    document.getElementById("lightbox-close").addEventListener("click", fecharLightbox);
    
    document.getElementById("lightbox").addEventListener("click", (e) => {
        if (e.target.id === "lightbox") fecharLightbox();
    });
    
    document.addEventListener("keydown", (e) => {
        if (!document.getElementById("lightbox").classList.contains("hide")) {
            if (e.key === "ArrowRight") proxima();
            if (e.key === "ArrowLeft") anterior();
            if (e.key === "Escape") fecharLightbox();
        }
    });
}



/* ================================
   INICIAR
================================== */
carregarJogo();
registrarEventosLightbox();
