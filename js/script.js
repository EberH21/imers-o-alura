const API_KEY = "abd2a5c9a49e451eae11805160e57425";
const BASE_URL = `https://api.rawg.io/api/games?key=${API_KEY}`;

let proximaPaginaUrl = null;
let carregando = false;

const campoBusca = document.getElementById('campo-busca');
let sugestoesContainer;

document.addEventListener('DOMContentLoaded', () => {
    iniciarPagina();
    criarContainerDeSugestoes();
    adicionarEventosDeBusca();
});

function iniciarPagina() {
    const path = window.location.pathname.split("/").pop();
    let url;

    switch (path) {
        case 'competitivos.html':
        case 'campeonatos.html':
            url = `${BASE_URL}&tags=competitive&ordering=-added&page_size=20`;
            break;
        // Adicione outros casos aqui (ex: 'multiplayer.html')
        default: // Para index.html e outros casos
            url = `${BASE_URL}&ordering=-added,-rating&page_size=20`;
            break;
    }
    carregarJogos(url, false, true);
}

function iniciarBusca() {
    const termoBusca = document.getElementById('campo-busca').value;

    if (termoBusca.trim() === "") {
        carregarJogos(`${BASE_URL}&ordering=-rating&page_size=20`, false, true);
        return;
    }

    const urlBusca = `${BASE_URL}&search=${encodeURIComponent(termoBusca)}&ordering=-rating&page_size=20`;

    // Busca NÃO filtra NSFW
    carregarJogos(urlBusca, false, false);
}

function criarContainerDeSugestoes() {
    sugestoesContainer = document.createElement('div');
    sugestoesContainer.id = 'sugestoes-busca';
    campoBusca.parentNode.style.position = 'relative';
    campoBusca.parentNode.appendChild(sugestoesContainer);
}

function adicionarEventosDeBusca() {
    campoBusca.addEventListener('input', async () => {
        const termo = campoBusca.value.trim();

        if (termo.length < 3) {
            sugestoesContainer.innerHTML = '';
            sugestoesContainer.style.display = 'none';
            return;
        }

        const url = `${BASE_URL}&search=${encodeURIComponent(termo)}&page_size=5`;
        try {
            const resposta = await fetch(url);
            const dados = await resposta.json();
            mostrarSugestoes(dados.results);
        } catch (erro) {
            console.error("Erro ao buscar sugestões:", erro);
        }
    });

    // Esconde as sugestões se clicar fora
    document.addEventListener('click', (e) => {
        if (!campoBusca.contains(e.target)) {
            sugestoesContainer.style.display = 'none';
        }
    });
}

function mostrarSugestoes(jogos) {
    sugestoesContainer.innerHTML = '';
    sugestoesContainer.style.display = 'block';
    jogos.forEach(jogo => {
        sugestoesContainer.innerHTML += `
            <a href="jogo.html?id=${jogo.id}" class="sugestao-item">${jogo.name}</a>`;
    });
}

async function carregarJogos(url, anexar = false, aplicarFiltro = true) {
    if (carregando) return;
    carregando = true;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        proximaPaginaUrl = dados.next;

        let jogos = dados.results;

        // FILTRO SOMENTE SE aplicarFiltro = true (ex.: página inicial)
        if (aplicarFiltro) {
            const palavrasProibidas = [
                "nsfw", "hentai", "adult", "erotic", "porn", "tentacles"
            ];

            jogos = jogos.filter(jogo => {
                const lancado = jogo.released && new Date(jogo.released) <= new Date();
                const temNota = jogo.rating && jogo.rating > 0;
                const naoEh18 = !jogo.esrb_rating || jogo.esrb_rating.name !== "Mature";

                const tags = jogo.tags?.map(t => t.slug.toLowerCase()) || [];
                const semTagsProibidas = !tags.some(tag =>
                    palavrasProibidas.some(banida => tag.includes(banida))
                );

                return lancado && temNota && naoEh18 && semTagsProibidas;
            });
        }

        mostrarJogos(jogos, anexar);

    } catch (erro) {
        console.error("Erro ao carregar jogos da API:", erro);
    } finally {
        carregando = false;
    }
}

window.addEventListener('scroll', () => {
    if (!carregando && proximaPaginaUrl &&
        (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {

        // Scroll infinito mantém o filtro na página inicial
        carregarJogos(proximaPaginaUrl, true, true);
    }
});

function mostrarJogos(lista, anexar = false) {
    const container = document.getElementById("cards");
    if (!container) return;

    if (!anexar) container.innerHTML = "";

    lista.forEach(jogo => {
        const div = document.createElement("article");
        div.className = "card";

        div.innerHTML = `
            <a href="jogo.html?id=${jogo.id}">
                <div class="thumb">
                    <img src="${jogo.background_image}" alt="${jogo.name}">
                </div>

                <div class="card-body">
                    <h2>${jogo.name}</h2>
                    <p><strong>Nota:</strong> ${jogo.rating}</p>
                    <p><strong>Gênero:</strong> ${jogo.genres.map(g => g.name).join(", ")}</p>
                </div>
            </a>
        `;

        container.appendChild(div);
    });
}
