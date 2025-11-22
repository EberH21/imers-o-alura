const API_KEY = "abd2a5c9a49e451eae11805160e57425"; // Chave da API RAWG
const API_URL_BASE = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=24`; // Carrega o equivalente a ~3 fileiras por vez

const loadMoreButton = document.getElementById("btn-carregar-mais");
const cardsContainer = document.getElementById('cards'); 
const campoBusca = document.getElementById('campo-busca');
const botaoBusca = document.getElementById('botao-busca');
const sugestoesContainer = document.getElementById('sugestoes-busca');

let proximaPaginaUrl = ''; // Variável para guardar a URL da próxima página
let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const termoBusca = urlParams.get('busca');

  // Se houver um termo de busca na URL, carrega os resultados da busca
  if (termoBusca) {
    campoBusca.value = termoBusca; // Preenche o campo de busca com o termo
    if (cardsContainer) iniciarLazyLoading(); // Garante que o lazy loading seja iniciado
    realizarBusca(termoBusca);
  } 
  // Se não, e se estivermos na página principal (com cards), carrega os jogos padrão
  else if (cardsContainer) {
    carregarJogos(API_URL_BASE);
    iniciarLazyLoading(); // Inicia o observador de imagens
  }

  // Adiciona o evento de clique ao botão "Carregar Mais", se ele existir
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => carregarJogos(proximaPaginaUrl));
  }

  // Adiciona eventos para a funcionalidade de busca
  campoBusca.addEventListener('input', handleSearchInput);
  botaoBusca.addEventListener('click', handleSearchButtonClick);
});

async function carregarJogos(url) {
  if (!url) return; // Não faz nada se não houver URL

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) {
      throw new Error(`Erro ao carregar jogos da API: ${resposta.status} ${resposta.statusText}`);
    }
    const dados = await resposta.json();
    mostrarJogos(dados.results); 

    proximaPaginaUrl = dados.next; // Guarda a URL da próxima página
    atualizarVisibilidadeBotao(); // Mostra ou esconde o botão "Carregar Mais"

  } catch (erro) {
    console.error(erro);
    mostrarErroNaTela("Não foi possível carregar os jogos. Veja o console para mais detalhes.");
  }
}

function mostrarJogos(lista) {
  if (!cardsContainer) {
    console.error('Container #cards não encontrado no HTML.');
    return;
  }

  lista.forEach(jogo => {
    const article = document.createElement('article');
    article.className = 'card';

    article.innerHTML = `
      <a href="jogo.html?id=${jogo.id}">
        <div class="thumb">
          <!-- A imagem real vai em 'data-src'. 'src' fica com um placeholder ou vazio -->
          <img data-src="${jogo.background_image || 'assets/img/default-cover.png'}" alt="Capa do jogo ${jogo.name}" class="lazy-image">
        </div>

        <div class="card-body">
          <h2>${jogo.name}</h2>
          <div class="reviews">
            <span>⭐ ${jogo.rating ? `${jogo.rating.toFixed(1)}&nbsp;/&nbsp;5` : 'N/A'}</span>
          </div>
        </div>
      </a>
    `;

    cardsContainer.appendChild(article);
  });

  // Após adicionar os novos cards, observa as novas imagens
  observarNovasImagens();
}

let lazyImageObserver;

function iniciarLazyLoading() {
  lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src; // Carrega a imagem real
        img.classList.remove('lazy-image'); // Remove a classe para não carregar de novo
        observer.unobserve(img); // Para de observar esta imagem
      }
    });
  }, {
    // Carrega a imagem um pouco antes de ela entrar na tela
    rootMargin: "0px 0px 200px 0px" 
  });
}

function observarNovasImagens() {
  const lazyImages = document.querySelectorAll('.lazy-image');
  lazyImages.forEach(img => lazyImageObserver.observe(img));
}

function atualizarVisibilidadeBotao() {
  if (loadMoreButton) {
    loadMoreButton.style.display = proximaPaginaUrl ? 'block' : 'none';
  }
}

function mostrarErroNaTela(msg) {
  const container = document.getElementById('cards') || document.body;

  const el = document.createElement('p');
  el.style.color = 'tomato';
  el.textContent = msg;

  container.appendChild(el);
}

/* ================================
   FUNCIONALIDADE DE BUSCA
================================== */

/**
 * Lida com a entrada de texto no campo de busca, com debounce.
 */
function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const termo = campoBusca.value.trim();
        if (termo.length > 2) {
            buscarSugestoes(termo);
        } else {
            sugestoesContainer.style.display = 'none';
        }
    }, 300); // Espera 300ms após o usuário parar de digitar
}

/**
 * Busca sugestões de jogos na API.
 */
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

/**
 * Exibe as sugestões de busca abaixo do campo.
 */
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

/**
 * Lida com o clique no botão de busca.
 */
function handleSearchButtonClick() {
  const termo = campoBusca.value.trim();
  if (termo) {
    // Redireciona para a página inicial com o termo de busca como parâmetro na URL
    window.location.href = `index.html?busca=${encodeURIComponent(termo)}`;
  }
}

/**
 * Executa a busca e exibe os resultados na página.
 */
function realizarBusca(termo) {
  if (cardsContainer) {
    cardsContainer.innerHTML = ''; // Limpa os cards existentes
  }
  if (sugestoesContainer) {
    sugestoesContainer.style.display = 'none';
  }
  
  const searchUrl = `https://api.rawg.io/api/games?key=${API_KEY}&search=${termo}&page_size=24`;
  carregarJogos(searchUrl);
}
