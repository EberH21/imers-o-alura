const API_KEY = "abd2a5c9a49e451eae11805160e57425";
const BASE_URL = `https://api.rawg.io/api/games?key=${API_KEY}`;

let proximaPaginaUrl = null;
let carregando = false;

document.addEventListener('DOMContentLoaded', () => {
    // Página inicial usa FILTRO
    carregarJogos(`${BASE_URL}&ordering=-rating&page_size=20`, false, true);
});

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
