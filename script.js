document.addEventListener('DOMContentLoaded', () => {
  carregarJogos();
});

async function carregarJogos() {
  try {
    const resposta = await fetch('data.json');
    if (!resposta.ok) {
      throw new Error(`Erro ao carregar data.json: ${resposta.status} ${resposta.statusText}`);
    }
    const jogos = await resposta.json();
    mostrarJogos(jogos);
  } catch (erro) {
    console.error(erro);
    mostrarErroNaTela("Não foi possível carregar os jogos. Veja o console para mais detalhes.");
  }
}

function mostrarJogos(lista) {
  const container = document.getElementById('cards'); 

  if (!container) {
    console.error('Container #cards não encontrado no HTML.');
    return;
  }

  container.innerHTML = ""; // limpa

  lista.forEach(jogo => {
    const article = document.createElement('article');
    article.className = 'card';

    article.innerHTML = `
      <a href="#">
        <div class="thumb">
          <img src="${jogo.imagem || 'assets/img/banner.png'}" alt="Capa do jogo ${jogo.nome}">
        </div>

        <div class="card-body">
          <h2>${jogo.nome}</h2>
          <p class="meta">
            <strong>Avaliação Geral:</strong> ${jogo.nota ?? '—'}
          </p>
        </div>
      </a>

      <div class="reviews">
        <strong>Reviews:</strong>
        ${(jogo.reviews || []).map(r => 
          `<a href="${r.link}" target="_blank" rel="noopener">
            ${r.site} — ${r.nota || r.score || ''}
          </a>`
        ).join('')}
      </div>
    `;

    container.appendChild(article);
  });
}

function mostrarErroNaTela(msg) {
  const container = document.getElementById('cards') || document.body;

  const el = document.createElement('p');
  el.style.color = 'tomato';
  el.textContent = msg;

  container.appendChild(el);
}
