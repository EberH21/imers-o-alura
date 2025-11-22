const API_KEY = "abd2a5c9a49e451eae11805160e57425";
const cardsContainer = document.getElementById("cards");
const loadMoreButton = document.getElementById("btn-carregar-mais");
const spinner = document.querySelector(".spinner");
const loadingContainer = document.getElementById("carregamento-container");
const campoBusca = document.getElementById('campo-busca');
const botaoBusca = document.getElementById('botao-busca');
const sugestoesContainer = document.getElementById('sugestoes-busca');

let nextPage = 1;
const TAGS = "multiplayer,online-co-op,co-op,cooperative,pve"; // Tags específicas para esta página

// Observador para o Lazy Loading
let lazyImageObserver;

let debounceTimer;

/**
 * Cria o HTML para um card de jogo.
 */
function criarCard(jogo) {
    return `
        <div class="card">
            <a href="jogo.html?id=${jogo.id}">
                <div class="thumb">
                    <img data-src="${jogo.background_image || 'assets/img/default-cover.png'}" alt="Capa do ${jogo.name}" class="lazy-image">
                </div>
                <div class="card-body">
                    <h2>${jogo.name}</h2>
                    <div class="reviews">
                        <span>⭐ ${jogo.rating}&nbsp;/&nbsp;5</span>
                    </div>
                </div>
            </a>
        </div>
    `;
}

/**
 * Exibe os cards dos jogos na página.
 */
function exibirCards(jogos) {
    let cardsHTML = "";
    jogos.forEach(jogo => {
        cardsHTML += criarCard(jogo);
    });
    cardsContainer.innerHTML += cardsHTML;
    observarNovasImagens();
}

/**
 * Busca jogos na API da RAWG com a tag específica.
 */
async function buscarJogos(page = 1) {
    try {
        // Mostra o spinner e desabilita o botão
        spinner.style.display = "block";
        loadMoreButton.style.display = "none";

        const url = `https://api.rawg.io/api/games?key=${API_KEY}&tags=${TAGS}&page=${page}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            exibirCards(data.results);
            // Se houver uma próxima página, atualiza o nextPage
            if (data.next) {
                nextPage = page + 1;
                loadingContainer.style.display = "flex"; // Garante que o container do botão apareça e permaneça centralizado
            } else {
                // Se não houver mais páginas, esconde o container do botão
                loadingContainer.style.display = "none";
            }
        } else {
            // Esconde o botão se não houver resultados
            loadingContainer.style.display = "none";
        }

    } catch (error) {
        console.error("Erro ao buscar jogos multiplayer:", error);
        cardsContainer.innerHTML = "<p>Ocorreu um erro ao carregar os jogos. Tente novamente mais tarde.</p>";
    } finally {
        // Esconde o spinner e reabilita o botão
        spinner.style.display = "none";
        loadMoreButton.style.display = "block";
    }
}

/**
 * Lida com o clique no botão "Carregar Mais".
 */
function handleLoadMore() {
    if (nextPage) {
        buscarJogos(nextPage);
    }
}

/**
 * Inicializa a página.
 */
function init() {
    loadMoreButton.addEventListener("click", handleLoadMore);
    iniciarLazyLoading();
    buscarJogos(1);

    if (campoBusca && botaoBusca) {
        campoBusca.addEventListener('input', handleSearchInput);
        botaoBusca.addEventListener('click', handleSearchButtonClick);
    }
}

/**
 * Inicializa o lazy loading.
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

// Inicia o script quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", init);

/* ================================
   FUNCIONALIDADE DE BUSCA
================================== */

function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const termo = campoBusca.value.trim();
        if (termo.length > 2) {
            buscarSugestoes(termo);
        } else {
            sugestoesContainer.style.display = 'none';
        }
    }, 300);
}

async function buscarSugestoes(termo) {
    try {
        const url = `https://api.rawg.io/api/games?key=${API_KEY}&search=${termo}&page_size=5`;
        const resposta = await fetch(url);
        const dados = await resposta.json();
        mostrarSugestoes(dados.results);
    } catch (erro) {
        console.error("Erro ao buscar sugestões:", erro);
    }
}

function mostrarSugestoes(jogos) {
    sugestoesContainer.innerHTML = '';
    if (!jogos || jogos.length === 0) {
        sugestoesContainer.style.display = 'none';
        return;
    }

    jogos.forEach(jogo => {
        const sugestaoEl = document.createElement('a');
        sugestaoEl.className = 'sugestao-item';
        sugestaoEl.href = `jogo.html?id=${jogo.id}`;
        sugestaoEl.textContent = jogo.name;
        sugestoesContainer.appendChild(sugestaoEl);
    });

    sugestoesContainer.style.display = 'block';
}

function handleSearchButtonClick() {
    const termo = campoBusca.value.trim();
    if (termo) {
        cardsContainer.innerHTML = '';
        sugestoesContainer.style.display = 'none';
        
        const searchUrl = `https://api.rawg.io/api/games?key=${API_KEY}&search=${termo}&page_size=24`;
        
        // Adaptado para usar a função de busca existente neste script
        fetch(searchUrl)
            .then(res => res.json())
            .then(data => {
                exibirCards(data.results);
                // Esconde o botão "Carregar Mais" após uma busca
                if (loadingContainer) {
                    loadingContainer.style.display = 'none';
                }
            })
            .catch(err => console.error("Erro na busca:", err));
    }
}