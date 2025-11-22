const API_JOGO = "abd2a5c9a49e451eae11805160e57425";
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get("id");
const LOJAS_MAP = {
    1: "Steam",
    2: "Xbox Store",
    3: "PlayStation Store",
    5: "GOG",
    6: "Nintendo",
    7: "Xbox 360 Marketplace",
    8: "Google Play",
    9: "Itch.io",
    11: "Epic Games",
    13: "Humble Store"
};


/* ================================
   FUNÇÃO AUXILIAR — ESTRELAS
================================== */
function notaParaPercentual(nota) {
    const v = Number(nota) || 0;
    return Math.max(0, Math.min(100, (v / 5) * 100));
}

/* ================================
   FUNÇÃO AUXILIAR — REMOVER TEXTO EM ESPANHOL
================================== */
function removerParteEspanhol(texto) {
    if (!texto) return "";

    // Se encontrar "Español", corta tudo depois
    const index = texto.indexOf("Español");
    if (index !== -1) {
        return texto.substring(0, index).trim();
    }

    return texto;
}

/* ================================
   LAZY LOADING OBSERVER
================================== */
let lazyImageObserver;
/* ================================
   CARREGAR DADOS DO JOGO
================================== */
async function carregarJogo() {
    try {
        const resp = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_JOGO}&stores=true`);
        const jogo = await resp.json();

        document.getElementById("game-title").textContent = jogo.name || "Sem nome";

        document.getElementById("game-cover").src =
            jogo.background_image || "../assets/img/default-cover.png";

        const descElement = document.getElementById("game-description");
        const originalDescription = limparDescricao(jogo.description_raw);
        descElement.innerText = originalDescription;

        // Adiciona o botão de tradução se houver descrição, independentemente do tamanho
        if (originalDescription) {
            adicionarBotaoTraduzir(descElement, originalDescription);
        }

        function limparDescricao(desc) {
            if (!desc) {
                descElement.style.display = 'none'; // Esconde a caixa se não houver descrição
                return "";
            }
            return removerParteEspanhol(desc.replace(/https?:\/\/[^\s]+/g, "")); // remove links e parte em espanhol
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

        carregarLojasReais()
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
        textElement.parentNode.insertBefore(btn, textElement.nextSibling.nextSibling); // Insere após o botão de tradução, se existir

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
function gerarBotoesLojasReais(lojas) {
    const container = document.getElementById("store-buttons");
    container.innerHTML = "";

    if (!lojas || lojas.length === 0) {
        container.innerHTML = "<p>Não disponível em lojas digitais.</p>";
        return;
    }

    lojas.forEach(item => {
        const storeName = LOJAS_MAP[item.store_id];
        const storeUrl = item.url;

        if (!storeName || !storeUrl) return;

        const botao = document.createElement("a");
        botao.className = "loja-btn";
        botao.textContent = storeName;
        botao.href = storeUrl;
        botao.target = "_blank";
        botao.rel = "noopener noreferrer";

        container.appendChild(botao);
    });
}





async function carregarLojasReais() {
    try {
        const resp = await fetch(
            `https://api.rawg.io/api/games/${gameId}/stores?key=${API_JOGO}`
        );

        const dados = await resp.json();
        const lojas = dados.results || [];

        gerarBotoesLojasReais(lojas);

    } catch (e) {
        console.error("Erro ao carregar lojas reais:", e);
    }
}



/* ================================
   SCREENSHOTS + LIGHTBOX
================================== */
async function carregarTrailer() {
    try {
        const resp = await fetch(
            `https://api.rawg.io/api/games/${gameId}/movies?key=${API_JOGO}`
        );
        const dados = await resp.json();

        const container = document.getElementById("trailers-container");
        container.innerHTML = "";

        const videos = dados.results || [];

        if (videos.length === 0) {
            container.innerHTML = "<p>Nenhum trailer disponível.</p>";
            return;
        }

        videos.forEach((movie, i) => {
            const videoUrl = movie?.data?.max || movie?.data?.[480];
            const thumbnailUrl = movie.preview;

            if (!videoUrl || !thumbnailUrl) return; // Pula se não tiver URL de vídeo ou thumbnail

            // Cria o container para a miniatura e o ícone de play
            const thumbContainer = document.createElement('div');
            thumbContainer.className = 'video-thumbnail-container';

            // Cria a imagem da miniatura
            const img = document.createElement("img");
            img.src = thumbnailUrl;
            img.className = "screenshot"; // Reutiliza o estilo das screenshots

            // Cria o ícone de play
            const playIcon = document.createElement('div');
            playIcon.className = 'play-icon';

            thumbContainer.appendChild(img);
            thumbContainer.appendChild(playIcon);
            container.appendChild(thumbContainer);
        });

        observarNovasImagens(); // Ativa o lazy loading para os vídeos

    } catch (e) {
        console.error("Erro trailer:", e);
    }
}

/* ================================
   REVIEWS
================================== */
async function carregarReviews() {
    try {
        const resp = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_JOGO}`);
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
            `https://api.rawg.io/api/games/${gameId}/screenshots?key=${API_JOGO}`
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

        observarNovasImagens(); // Ativa o lazy loading para as screenshots

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

/**
 * Inicializa o lazy loading para as imagens da página.
 */
function iniciarLazyLoading() {
    lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // Carrega a imagem real
                img.classList.remove('lazy-image');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: "0px 0px 200px 0px" }); // Carrega 200px antes de a imagem entrar na tela
}

/**
 * Adiciona novas imagens ao observador de lazy loading.
 */
function observarNovasImagens() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    lazyImages.forEach(img => lazyImageObserver.observe(img));
}


/* ================================
   TRADUÇÃO DA DESCRIÇÃO
================================== */

async function traduzirTexto(texto) {
    const MAX_LENGTH = 4500; // Limite seguro do endpoint gratuito
    const partes = [];

    // Divide automaticamente textos grandes
    if (texto.length <= MAX_LENGTH) {
        partes.push(texto);
    } else {
        let temp = texto;
        while (temp.length > 0) {
            let chunk = temp.substring(0, MAX_LENGTH);
            let ultimoEspaco = chunk.lastIndexOf(" ");

            if (ultimoEspaco !== -1 && temp.length > MAX_LENGTH) {
                chunk = chunk.substring(0, ultimoEspaco);
            }

            partes.push(chunk);
            temp = temp.substring(chunk.length);
        }
    }

    // Traduz cada parte usando o Google
    const promessas = partes.map(async (parte) => {
        const url =
            "https://translate.googleapis.com/translate_a/single" +
            "?client=gtx&sl=en&tl=pt&dt=t&q=" +
            encodeURIComponent(parte);

        const resp = await fetch(url);
        const data = await resp.json();

        return data[0].map(t => t[0]).join("");
    });

    // Junta tudo em um texto só
    const partesTraduzidas = await Promise.all(promessas);
    return partesTraduzidas.join(" ");
}

function adicionarBotaoTraduzir(descElement, textoOriginal) {
    const btn = document.createElement('button');
    btn.textContent = 'Traduzir Descrição';
    btn.className = 'btn-traduzir';
    descElement.parentNode.insertBefore(btn, descElement.nextSibling);

    let estaTraduzido = false;

    btn.addEventListener('click', async () => {
        if (estaTraduzido) {
            descElement.innerText = textoOriginal;
            btn.textContent = 'Traduzir Descrição';
            estaTraduzido = false;
            return;
        }

        btn.textContent = 'Traduzindo...';
        btn.disabled = true;

        try {
            const textoTraduzido = await traduzirTexto(textoOriginal);
            descElement.innerText = textoTraduzido;
            btn.textContent = 'Mostrar Original';
            estaTraduzido = true;
        } catch (e) {
            console.error("Erro na API de tradução:", e);
            btn.textContent = 'Erro ao traduzir';
        } finally {
            btn.disabled = false;
        }
    });
}


/* ================================
   INICIAR
================================== */
carregarJogo();
iniciarLazyLoading();
registrarEventosLightbox();
