/* =====================================================
   Renília Books – lógica do site (script.js)
   Os dados ficam no localStorage; não há servidor.
   Índice: 1 Utilitários · 2 Configurações · 3 Dados iniciais · 4 Estado
           5 Auxiliares · 6 Janelas · 7 Telas · 8 Renderização e eventos
   ===================================================== */

/* ---------- 1. UTILITÁRIOS ----------
   $ = atalho do querySelector; esc() protege contra HTML injetado; hs() embaralha a senha (só demonstração). */
const $=(s,e=document)=>e.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hs=s=>btoa(unescape(encodeURIComponent('rb'+s))),K='renilia_v5',PER=60000,G=['Romance','Conto','Poesia','Aventura'];

/* ---------- 2. CONFIGURAÇÕES QUE VOCÊ PODE EDITAR ----------
   K   = nome da chave no localStorage (mude para zerar os dados salvos)
   PER = tempo mínimo (ms) após criar a conta para trocar a senha (RF02)
   G   = lista de gêneros literários (RF06)
   BAD = palavras proibidas no chat, em expressão regular (RF22) */
const BAD=/merda|porra|caralho|puta|idiota|babaca|lixo/gi;

/* ---------- 3. DADOS INICIAIS ----------
   B0: cada livro = [título, autor, gênero, ano, sinopse, matiz da cor da capa (0-360), URL do PDF] */
const B0=[['Dom Casmurro','Machado de Assis','Romance',1899,'Bentinho revive a juventude e a dúvida sobre Capitu, num dos maiores romances da língua portuguesa.',12,'dom-casmurro.pdf','dom-casmurro.jpg'],
['Memórias Póstumas de Brás Cubas','Machado de Assis','Romance',1881,'Um defunto-autor conta sua vida com ironia e humor ácido.',200,'memorias-postumas.pdf','memorias_postumas.jpg'],
['Iracema','José de Alencar','Romance',1865,'Lenda do Ceará: o amor entre a índia Iracema e o guerreiro português Martim.',150,'iracema.pdf','iracema.jpg'],
['O Alienista','Machado de Assis','Conto',1882,'O doutor Simão Bacamarte funda um hospício e questiona o que é a sanidade.',280,'o-alienista.pdf','alienista.jpg'],
['A Cartomante','Machado de Assis','Conto',1884,'Um triângulo amoroso e uma consulta que muda o destino de três personagens.',30,'a-cartomante.pdf','a_cartomante.jpg'],
['Eu','Augusto dos Anjos','Poesia',1912,'Versos de um poeta singular, entre a ciência e a angústia.',320,'eu.pdf','eu.jpg'],
['Broquéis','Cruz e Sousa','Poesia',1893,'Marco do simbolismo brasileiro, de musicalidade e imagens luminosas.',240,'pdfs/broqueis.pdf','broqueis.jpg'],
['O Guarani','José de Alencar','Aventura',1857,'Peri e Cecília enfrentam perigos na natureza e nos conflitos coloniais.',100,'o-guarani.pdf','o_guarani.jpg'],
['Quarto de Despejo','Carolina Maria de Jesus','Aventura',1960,'Diário de uma mulher negra, mãe solteira, que vive na favela do Canindé, em São Paulo.',60,'Quarto de Despejo - Maria Carolina de Jesus.pdf','quarto_de_despejo.jpg']];

/* seed(): cria o banco de dados de exemplo (usuários, livros, leituras, grupos e destaques).
   Usuários de teste: admin/admin123 (administrador), ana/123456, carlos/123456. */
const seed=()=>({cur:null,until:new Date(Date.now()+14*864e5).toISOString().slice(0,10),
users:[{u:'admin',p:hs('admin123'),c:0,pub:1,role:'a'},{u:'ana',p:hs('123456'),c:0,pub:1},{u:'carlos',p:hs('123456'),c:0,pub:1}],
books:B0.map((b,i)=>({id:i+1,t:b[0],a:b[1],g:b[2],y:b[3],d:b[4],h:b[5],p:b[6]||'',cv:b[7]||''})),
reads:[{u:'ana',b:1,st:'lida',r:5,fav:1,op:'Uma releitura obrigatória, cada capítulo traz uma dúvida nova.'},{u:'carlos',b:1,st:'lida',r:4,fav:0,op:'Narrador pouco confiável e muito bem escrito.'},{u:'ana',b:3,st:'lendo',r:0,fav:0,op:''}],
groups:[{id:1,name:'Clube Machado de Assis',mem:['ana','carlos'],msgs:[{u:'ana',t:'Quem já terminou Dom Casmurro?'}]}],
feat:{Romance:1,Conto:4,Poesia:6,Aventura:8}});

/* ---------- 4. ESTADO E PERSISTÊNCIA ----------
   S = todos os dados do site; save() grava no localStorage do navegador.
   Variáveis de tela: V = tela atual, q = busca, gf = gênero filtrado, gid = grupo aberto, tab = aba de leituras, mode = login/cadastro */
let S;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}S=S||seed();
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
let V='home',q='',gf='',gid=null,tab='todas',mode='in',sw=false;

/* ---------- 5. FUNÇÕES AUXILIARES ----------
   me() usuário logado; bk(id) busca livro; rd(livro) leitura do usuário; avg() média de estrelas; setRd() cria/atualiza leitura */
const me=()=>S.users.find(x=>x.u===S.cur),bk=id=>S.books.find(b=>b.id==id),rd=(b,u=S.cur)=>S.reads.find(x=>x.b==b&&x.u===u);
const st=n=>'★'.repeat(n)+'☆'.repeat(5-n),isA=()=>me()?.role==='a';
const avg=b=>{const r=S.reads.filter(x=>x.b==b&&x.r);return r.length?(r.reduce((s,x)=>s+x.r,0)/r.length).toFixed(1)+' ★ ('+r.length+')':'sem avaliações'};

/* toast(msg): mostra um aviso rápido na parte de baixo da tela */
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3500)}

/* setRd(livro, mudanças): registra status, nota, favorito ou opinião (RF10 a RF15, RF17) */
function setRd(b,p){let r=rd(b);if(!r)S.reads.push(r={u:S.cur,b:+b,st:'',r:0,fav:false,op:''});Object.assign(r,p);save()}

/* cover(b) desenha a capa; card(b) é o cartão clicável do livro na grade */
const cover=b=>b.cv?`<div class="cover" style="padding:0;overflow:hidden;border-left:0"><img src="${esc(b.cv)}" alt="Capa de ${esc(b.t)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></div>`:`<div class="cover" style="background:linear-gradient(135deg,hsl(${b.h} 55% 38%),hsl(${b.h+40} 50% 20%))"><span>${esc(b.t)}</span><small>${esc(b.a)}</small></div>`;
const card=b=>`<button class="bk" data-a="book" data-i="${b.id}" aria-label="Abrir ${esc(b.t)}">${cover(b)}<div class="meta">${esc(b.g)} · ${avg(b.id)}</div></button>`;

/* ---------- 6. JANELAS ----------
   dlg(html) abre um modal; ask(msg, função) pede confirmação antes de ações perigosas */
function dlg(h){const d=$('#dlg');d.innerHTML=`<button class="x" data-a="close" aria-label="Fechar">✕</button>`+h;if(!d.open)d.showModal()}
function ask(m,fn){ask.f=fn;dlg(`<p>${m}</p><div class="row"><button class="d" data-a="yes">Confirmar</button><button data-a="close">Cancelar</button></div>`)}

/* ---------- 7. TELAS (cada função devolve o HTML de uma tela) ----------
   head(): cabeçalho e menu (o menu Administração só aparece para admin – RF28) */
function head(){const m=me();$('#hd').innerHTML=`<span class="logo">${ic('book',24)} Renília Books</span>`+(m?`<nav aria-label="Principal">${[['home','Início'],['lib','Biblioteca'],['mine','Minhas leituras'],['com','Comunidade'],['perfil','Perfil']].concat(isA()?[['adm','Administração']]:[]).map(([v,t])=>`<button data-a="nav" data-i="${v}" class="${V===v?'on':''}">${t}</button>`).join('')}</nav><div class="row"><span class="tag">@${esc(m.u)}</span><button data-a="tema" aria-label="Alternar tema claro ou escuro">${ic(dark()?'sun':'moon')}</button><button data-a="sw">Trocar de perfil</button><button data-a="out">Sair</button></div>`:'<nav></nav><button data-a="tema" aria-label="Alternar tema claro ou escuro">'+ic(dark()?'sun':'moon')+'</button>')}

/* auth(): login e cadastro (RF01) + botão de ajuda ao suporte (RF04) */
function auth(){const s=mode==='up';return `<div class="card auth"><h1>${s?'Criar conta':'Entrar'}</h1><p class="muted">Leia, avalie e converse com outros leitores.</p>${sw?'<p class="tag">Escolha o perfil para entrar</p>':''}
<form data-f="${s?'up':'in'}"><label for="u">Usuário (único)</label><input id="u" required minlength="3" maxlength="20" autocomplete="username"><label for="p">Senha</label><input id="p" type="password" required minlength="6" autocomplete="${s?'new-password':'current-password'}">${s?'<label for="p2">Confirmar senha</label><input id="p2" type="password" required minlength="6">':''}
<div class="row" style="margin-top:1rem"><button class="p">${s?'Cadastrar':'Entrar'}</button><button type="button" data-a="mode">${s?'Já tenho conta':'Criar nova conta'}</button><button type="button" data-a="help">Preciso de ajuda</button></div></form>
</div>`}

/* home(): leitura em destaque por gênero e opiniões da comunidade (RF24, RF16) */
function home(){const d=S.until.split('-').reverse().join('/');return `<section class="hero"><h1>Leitura em destaque</h1><p>A cada período, uma obra por gênero é escolhida para lermos juntos. Destaques valem até <b>${d}</b>. Registre sua leitura, avalie e compartilhe sua opinião.</p></section>
${carrossel()}
<h2 style="margin-top:1.5rem">O que a comunidade anda lendo</h2>${S.reads.filter(x=>x.op&&x.u!==S.cur&&S.users.find(u=>u.u===x.u)?.pub).slice(-4).reverse().map(x=>`<div class="card"><b>@${esc(x.u)}</b> sobre <a href="#" data-a="book" data-i="${x.b}">${esc(bk(x.b)?.t)}</a> <span class="st">${st(x.r)}</span><p>${esc(x.op)}</p></div>`).join('')||'<p class="muted">Ainda não há opiniões públicas.</p>'}`}

/* lib(): biblioteca com busca e filtro por gênero (RF05 a RF07); grid() preenche a lista de livros */
function lib(){return `<h1>Biblioteca</h1><label for="q">Pesquisar por título, autor ou gênero</label><input id="q" type="search" value="${esc(q)}" placeholder="Ex.: Dom Casmurro, Poesia…"><div class="chips" role="group" aria-label="Gêneros"><button data-a="gf" data-i="" class="${gf?'':'on'}">Todos</button>${G.map(g=>`<button data-a="gf" data-i="${g}" class="${gf===g?'on':''}">${g}</button>`).join('')}</div><div id="grid" class="grid"></div>`}
function grid(){const g=$('#grid');if(!g)return;const n=q.toLowerCase(),l=S.books.filter(b=>(!gf||b.g===gf)&&(b.t+' '+b.a+' '+b.g).toLowerCase().includes(n));
if(!n&&!gf){g.className='';g.innerHTML=G.map(x=>{const s=l.filter(b=>b.g===x);return s.length?`<h2>${x}</h2><div class="shelf">${s.map(card).join('')}</div>`:''}).join('');return}
g.className='grid';g.innerHTML=l.map(card).join('')||'<p class="muted">Nenhuma obra encontrada.</p>'}
/* mine(): histórico, lendo, lidas e favoritas (RF10 a RF12, RF14) */
function mine(){const r=S.reads.filter(x=>x.u===S.cur&&x.st||x.u===S.cur&&x.fav),f={todas:()=>1,lendo:x=>x.st==='lendo',lida:x=>x.st==='lida',fav:x=>x.fav}[tab]||(()=>1);
return `<h1>Minhas leituras</h1><div class="chips">${[['todas','Histórico'],['lendo','Lendo'],['lida','Lidas'],['fav','Favoritas']].map(([k,t])=>`<button data-a="tab" data-i="${k}" class="${tab===k?'on':''}">${t}</button>`).join('')}</div>${r.filter(f).reverse().map(x=>`<div class="card row"><div style="width:60px">${cover(bk(x.b)).replace('font:700 1rem','font:700 .5rem')}</div><div style="flex:1"><b>${esc(bk(x.b)?.t)}</b> ${x.fav?ic('heart',14,1):''}<div class="muted">${x.st==='lida'?'Lida':x.st==='lendo'?'Lendo':'Favorita'} · <span class="st" style="font-size:1rem">${st(x.r)}</span></div></div><button data-a="book" data-i="${x.b}">Abrir</button></div>`).join('')||'<p class="muted">Nada por aqui ainda. Visite a biblioteca!</p>'}`}

/* com(): grupos e chat (RF18 a RF22) */
function com(){const g=S.groups.find(x=>x.id===gid),m=g&&g.mem.includes(S.cur);
return `<h1>Comunidade</h1><div class="two"><div><h2>Grupos</h2>${S.groups.map(x=>`<div class="card"><b>${esc(x.name)}</b><div class="muted">${x.mem.length} participante(s)</div><div class="row" style="margin-top:.4rem"><button data-a="grp" data-i="${x.id}">Abrir</button>${x.mem.includes(S.cur)?'<span class="tag">Participando</span>':`<button class="p" data-a="join" data-i="${x.id}">Participar</button>`}</div></div>`).join('')}
<form data-f="grp" class="card"><label for="gn">Criar grupo de discussão</label><input id="gn" required maxlength="40" placeholder="Nome do grupo"><button class="p" style="margin-top:.5rem">Criar</button></form></div>
<div><h2>${g?esc(g.name):'Chat'}</h2>${!g?'<p class="muted">Selecione um grupo.</p>':`<div class="chat" id="chat">${g.msgs.map(x=>`<div class="msg"><b>@${esc(x.u)}</b>: ${esc(x.t)}</div>`).join('')}</div>${m?`<form data-f="msg" class="row" style="margin-top:.5rem;flex-wrap:nowrap"><label for="mt" class="sr" style="position:absolute;left:-999px">Mensagem</label><input id="mt" required maxlength="300" placeholder="Escreva uma mensagem" autocomplete="off"><button class="p">Enviar</button></form>`:'<p class="muted">Participe do grupo para enviar mensagens.</p>'}`}</div></div>`}

/* perfil(): privacidade (RNF04), troca de senha (RF02) e exclusão da conta (RF27) */
function perfil(){const m=me();return `<h1>Meu perfil</h1><div class="two"><div class="card"><h2>@${esc(m.u)}</h2><p class="muted">${S.reads.filter(x=>x.u===m.u&&x.st==='lida').length} livro(s) lido(s) · ${S.reads.filter(x=>x.u===m.u&&x.fav).length} favorito(s)</p>
<label><input type="checkbox" style="width:auto" id="pub" ${m.pub?'checked':''} data-a="pub"> Perfil público (outros leitores veem minhas leituras e avaliações)</label></div>
<form data-f="pw" class="card"><h2>Alterar senha</h2><label for="n1">Nova senha</label><input id="n1" type="password" required minlength="6"><button class="p" style="margin-top:.5rem">Alterar</button><p class="muted" style="font-size:.8rem">Permitido após um período da criação da conta (demonstração: 1 minuto).</p></form></div>
<div class="card"><h2>Excluir conta</h2><p>O perfil e seus dados serão apagados definitivamente.</p><button class="d" data-a="del">Solicitar exclusão</button></div>`}

/* adm(): painel do administrador – destaques, cadastro, edição e remoção de obras (RF29 a RF32) */
function adm(){const g=G.map(x=>`<label for="f${x}">${x}</label><select id="f${x}" data-a="feat" data-i="${x}">${S.books.filter(b=>b.g===x).map(b=>`<option value="${b.id}" ${S.feat[x]==b.id?'selected':''}>${esc(b.t)}</option>`).join('')}</select>`).join('');
return `<h1>Administração</h1><div class="two"><div class="card"><h2>Obras em destaque</h2>${g}<label for="un">Destaque válido até</label><input type="date" id="un" value="${S.until}" data-a="until"></div><div id="bf">${bform()}</div></div><h2>Obras cadastradas</h2>${S.books.map(b=>`<div class="card row"><b style="flex:1">${esc(b.t)} <span class="tag">${b.g}</span></b><button data-a="eb" data-i="${b.id}">Editar</button><button class="d" data-a="rb" data-i="${b.id}">Remover</button></div>`).join('')}`}

/* bform(livro): formulário de cadastro/edição de obra (inclui campo de licença legal) */
function bform(b={}){return `<form data-f="bk" class="card"><h2>${b.id?'Editar obra':'Cadastrar obra'}</h2><input type="hidden" name="id" value="${b.id||''}"><label>Título</label><input name="t" required value="${esc(b.t)}"><label>Autor</label><input name="a" required value="${esc(b.a)}"><label>Gênero</label><select name="g">${G.map(x=>`<option ${b.g===x?'selected':''}>${x}</option>`).join('')}</select><label>Ano</label><input name="y" type="number" value="${b.y||''}"><label>Sinopse</label><textarea name="d" rows="3">${esc(b.d)}</textarea><label>PDF da obra (caminho ou link)</label><input name="p" placeholder="pdfs/livro.pdf" value="${esc(b.p||'')}"><label>Capa (caminho da imagem)</label><input name="cv" placeholder="capas/livro.jpg" value="${esc(b.cv||'')}"><label>Licença/origem legal</label><input name="l" required placeholder="Ex.: domínio público" value="${esc(b.l||'')}"><button class="p" style="margin-top:.6rem">Salvar</button></form>`}

/* book(id): janela do livro – ler, marcar lendo/lida, favoritar, nota, opinião e avaliações de outros (RF08, RF10 a RF17, RF25, RF26) */
function book(id){const b=bk(id),r=rd(id)||{},fe=Object.values(S.feat).includes(b.id),o=S.reads.filter(x=>x.b==id&&x.op&&x.u!==S.cur);
dlg(`<div class="row" style="align-items:flex-start"><div style="width:120px">${cover(b)}</div><div style="flex:1;min-width:200px"><h2>${esc(b.t)}</h2><p class="muted">${esc(b.a)} · ${b.y||''} · ${b.g} ${fe?'<span class="tag">★ Em destaque</span>':''}</p><p>${esc(b.d)}</p><p class="muted">Avaliação geral: ${avg(id)}${b.l?'<br>Licença: '+esc(b.l):'<br>Licença: domínio público'}</p></div></div>
<div class="row" style="margin:.6rem 0"><button class="p" data-a="read" data-i="${id}">${ic('book')} Ler</button><button data-a="s" data-i="${id}" data-v="lendo" class="${r.st==='lendo'?'on':''}">Lendo</button><button data-a="s" data-i="${id}" data-v="lida" class="${r.st==='lida'?'on':''}">Lida</button><button data-a="fav" data-i="${id}" aria-pressed="${!!r.fav}" class="${r.fav?'on':''}">${ic('heart',18,r.fav)} Favorita</button></div>
<div class="st" role="group" aria-label="Sua nota">${[1,2,3,4,5].map(n=>`<button data-a="rate" data-i="${id}" data-v="${n}" aria-label="${n} estrela(s)">${n<=(r.r||0)?'★':'☆'}</button>`).join('')}</div>
<form data-f="op" data-i="${id}"><label for="op">Minha opinião</label><textarea id="op" rows="3" maxlength="500">${esc(r.op)}</textarea><div class="row" style="margin-top:.4rem"><button class="p">Salvar opinião</button>${r.r||r.op?`<button type="button" class="d" data-a="delr" data-i="${id}">Remover minha avaliação</button>`:''}</div></form>
<h3 style="margin-top:1rem">Leitores</h3>${o.map(x=>{const pub=S.users.find(u=>u.u===x.u)?.pub;return `<div class="card"><b>${pub?'@'+esc(x.u):'Leitor privado'}</b> <span class="st" style="font-size:1rem">${st(x.r)}</span><p style="margin:.2rem 0">${esc(x.op)}</p></div>`}).join('')||'<p class="muted">Seja o primeiro a opinar.</p>'}`)}

/* help(): formulário de suporte (RF04) */
function help(){dlg(`<h2>Suporte</h2><p>Problemas técnicos para entrar? Descreva abaixo.</p><form data-f="help"><label for="he">Seu e-mail</label><input id="he" type="email" required><label for="hm">Mensagem</label><textarea id="hm" rows="4" required></textarea><button class="p" style="margin-top:.6rem">Enviar ao suporte</button></form>`)}

/* ---------- 8. RENDERIZAÇÃO E EVENTOS ----------
   R() redesenha a tela atual; go(tela) troca de tela */
function R(){head();const m=me();$('#app').innerHTML=!m?auth():({home,lib,mine,com,perfil,adm}[V]||home)();grid();const c=$('#chat');if(c)c.scrollTop=1e9;cs=0;autoCar()}
const go=v=>{V=v;R()};

/* CLIQUES: todo botão tem data-a="ação" e data-i="id". Para criar uma ação nova,
   coloque data-a no botão e adicione uma entrada com o mesmo nome no objeto abaixo. */
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,i=t.dataset.i,v=t.dataset.v;if(a!=='pub'&&a!=='feat'&&a!=='until')e.preventDefault&&t.tagName==='A'&&e.preventDefault();
const D=$('#dlg'),re=()=>{R();if(D.open&&['s','fav','rate','delr'].includes(a))book(i)};
({close:()=>D.close(),yes:()=>{D.close();ask.f()},nav:()=>go(i),mode:()=>{mode=mode==='in'?'up':'in';R()},help,
out:()=>{S.cur=null;sw=false;save();R()},sw:()=>{S.cur=null;sw=true;save();R()},
book:()=>book(i),gf:()=>{gf=i;R()},tab:()=>{tab=i;R()},grp:()=>{gid=+i;R()},
join:()=>{S.groups.find(x=>x.id==i).mem.push(S.cur);save();gid=+i;R()},
read:()=>{const b=bk(i),pg=rd(i)?.pg||1;dlg(`<h2>${esc(b.t)}</h2><p class="muted">${esc(b.a)}</p>`+(b.p?`<iframe id="pdf" src="${esc(b.p)}#page=${pg}" title="PDF de ${esc(b.t)}" style="width:100%;height:60vh;border:1px solid var(--br);border-radius:8px"></iframe><div class="row" style="margin:.5rem 0"><button data-a="full">${ic('maximize')} Tela cheia</button><label for="pg" style="margin:0">Parei na página</label><input id="pg" type="number" min="1" value="${pg}" style="width:90px"><button data-a="savepg" data-i="${i}">Salvar e ir</button></div><p><a href="${esc(b.p)}" target="_blank" rel="noopener">Abrir o PDF em outra aba</a></p>`:`<p class="muted">Esta obra ainda não tem PDF cadastrado.</p>`)+`<button class="p" data-a="s" data-i="${i}" data-v="lendo">Marcar como “lendo”</button>`)},
tema:()=>{setTema(dark()?'light':'dark');R()},
slide:()=>{irSlide(cs+Number(i));autoCar()},goto:()=>{irSlide(Number(i));autoCar()},
full:()=>{$('#pdf').requestFullscreen?.()},
savepg:()=>{const p=Number($('#pg').value)||1;setRd(i,{pg:p,st:rd(i)?.st||'lendo'});$('#pdf').src=bk(i).p+'#page='+p;toast('Página '+p+' salva')},
fz:()=>{const r=$('#rt');r.style.fontSize=(parseFloat(getComputedStyle(r).fontSize)+2*v)+'px'},
s:()=>{setRd(i,{st:v});toast('Leitura registrada: '+v);re()},fav:()=>{setRd(i,{fav:rd(i)?.fav?0:1});re()},rate:()=>{setRd(i,{r:+v});re()},
delr:()=>{setRd(i,{r:0,op:''});toast('Avaliação removida');re()},
pub:()=>{me().pub=t.checked?1:0;save();toast(t.checked?'Perfil público':'Perfil privado')},
feat:()=>{S.feat[i]=+t.value;save();toast('Destaque atualizado')},until:()=>{S.until=t.value;save()},
eb:()=>{$('#bf').innerHTML=bform(bk(i));$('#bf').scrollIntoView()},
rb:()=>ask('Remover esta obra da plataforma?',()=>{S.books=S.books.filter(b=>b.id!=i);S.reads=S.reads.filter(x=>x.b!=i);G.forEach(g=>{if(S.feat[g]==i)S.feat[g]=(S.books.find(b=>b.g===g)||{}).id});save();R()}),
del:()=>ask('Excluir sua conta definitivamente? Não há como desfazer.',()=>{const u=S.cur;S.users=S.users.filter(x=>x.u!==u);S.reads=S.reads.filter(x=>x.u!==u);S.groups.forEach(g=>g.mem=g.mem.filter(x=>x!==u));S.cur=null;save();R();toast('Conta excluída')})}[a]||(()=>{}))()});

/* Digitação na busca da biblioteca (filtra em tempo real) */
document.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;grid()}});

/* FORMULÁRIOS: cada <form> tem data-f="nome"; os blocos abaixo tratam login (in), cadastro (up), suporte (help),
   opinião (op), senha (pw), grupo (grp), mensagem do chat (msg) e obra (bk). */
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,k=f.dataset.f,F=Object.fromEntries(new FormData(f)),v=id=>$('#'+id,f)?.value;
if(k==='in'){const u=S.users.find(x=>x.u===v('u').trim());if(!u||u.p!==hs(v('p')))return toast('Usuário ou senha incorretos.');S.cur=u.u;V='home';save();R()}
if(k==='up'){const n=v('u').trim();if(S.users.some(x=>x.u.toLowerCase()===n.toLowerCase()))return toast('Esse usuário já existe. Escolha outro.');if(v('p')!==v('p2'))return toast('As senhas não coincidem.');S.users.push({u:n,p:hs(v('p')),c:Date.now(),pub:1});S.cur=n;V='home';save();R();toast('Conta criada! Bem-vindo(a).')}
if(k==='help'){$('#dlg').close();toast('Mensagem enviada ao suporte. Responderemos por e-mail.')}
if(k==='op'){setRd(f.dataset.i,{op:v('op').trim()});toast('Opinião salva');R()}
if(k==='pw'){const m=me(),w=PER-(Date.now()-m.c);if(w>0)return toast('Troca liberada em '+Math.ceil(w/1e3)+'s.');m.p=hs(v('n1'));save();f.reset();toast('Senha alterada.')}
if(k==='grp'){const id=Date.now();S.groups.push({id,name:v('gn').trim(),mem:[S.cur],msgs:[]});gid=id;save();R()}
if(k==='msg'){let t=v('mt'),c=t.replace(BAD,m=>'*'.repeat(m.length));if(c!==t)toast('Aviso: palavras ofensivas não são permitidas e foram censuradas.');S.groups.find(x=>x.id===gid).msgs.push({u:S.cur,t:c});save();R()}
if(k==='bk'){const o={t:F.t,a:F.a,g:F.g,y:F.y,d:F.d,l:F.l,p:F.p,cv:F.cv};if(F.id)Object.assign(bk(F.id),o);else S.books.push({id:Date.now(),h:Math.floor(Math.random()*360),...o});G.forEach(g=>{if(!bk(S.feat[g]))S.feat[g]=(S.books.find(b=>b.g===g)||{}).id});save();toast('Obra salva');R()}});

/* ---------- 9. NOVIDADES: ícones, tema, banner ---------- */
const IC={book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',heart:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.1 3 5.5l7 7Z"/>',maximize:'<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>'};
const ic=(n,s=18,f=0)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${f?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px">${IC[n]}</svg>`;

/* Tema: dark() diz se está escuro agora; setTema() grava a escolha do usuário */
const dark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches};
function setTema(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('renilia_tema',t)}catch(e){}}
try{const t=localStorage.getItem('renilia_tema');if(t)document.documentElement.dataset.theme=t}catch(e){}

/* Banner rotativo: carrossel() monta o HTML; irSlide() troca de slide; autoCar() passa sozinho a cada 5 s */
let cs=0,ct;
function carrossel(){const L=G.map(g=>bk(S.feat[g])).filter(Boolean);if(!L.length)return'';
return `<section class="car" aria-label="Obras em destaque">${L.map((b,n)=>`<div class="sl${n?'':' on'}"><div class="cv">${cover(b)}</div><div><span class="tag">${b.g} · destaque</span><h2>${esc(b.t)}</h2><p class="muted">${esc(b.a)}</p><p>${esc(b.d)}</p><button class="p" data-a="book" data-i="${b.id}">Ver obra</button></div></div>`).join('')}<button class="pv" data-a="slide" data-i="-1" aria-label="Destaque anterior">‹</button><button class="nx" data-a="slide" data-i="1" aria-label="Próximo destaque">›</button><div class="dots">${L.map((b,n)=>`<button data-a="goto" data-i="${n}" class="${n?'':'on'}" aria-label="Destaque ${n+1}"></button>`).join('')}</div></section>`}
function irSlide(n){const s=document.querySelectorAll('.car .sl'),d=document.querySelectorAll('.car .dots button');if(!s.length)return;cs=(n+s.length)%s.length;s.forEach((e,k)=>e.classList.toggle('on',k===cs));d.forEach((e,k)=>e.classList.toggle('on',k===cs))}
function autoCar(){clearInterval(ct);if(document.querySelector('.car')&&!matchMedia('(prefers-reduced-motion:reduce)').matches)ct=setInterval(()=>irSlide(cs+1),5000)}

/* Início: desenha a primeira tela ao abrir o site */
R();

