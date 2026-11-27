(() => {
  'use strict';

  // JEJAK NUR — playable browser prototype, version 0.1
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const mini = document.getElementById('minimap');
  const mctx = mini.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  mctx.imageSmoothingEnabled = false;

  const TILE = 32;
  const MAP_W = 48;
  const MAP_H = 36;
  const WORLD_W = MAP_W * TILE;
  const WORLD_H = MAP_H * TILE;
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (x, y, salt = 0) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };

  const T = { SAND: 0, GRASS: 1, ROAD: 2, STONE: 3, WATER: 4, DIRT: 5, TILE: 6 };
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.SAND));
  const setTile = (x, y, value) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) map[y][x] = value; };
  const rectTiles = (x, y, w, h, value) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setTile(xx, yy, value);
  };

  // Green gardens and sandy paths form the oasis town of Nuraya.
  rectTiles(2, 2, 44, 32, T.GRASS);
  // Soft sandy outskirts and dunes.
  rectTiles(0, 0, MAP_W, 2, T.SAND);
  rectTiles(0, 34, MAP_W, 2, T.SAND);
  rectTiles(0, 0, 2, MAP_H, T.SAND);
  rectTiles(46, 0, 2, MAP_H, T.SAND);
  // Main roads and plaza.
  rectTiles(3, 18, 42, 3, T.ROAD);
  rectTiles(23, 3, 3, 31, T.ROAD);
  rectTiles(8, 9, 17, 2, T.ROAD);
  rectTiles(27, 14, 15, 2, T.ROAD);
  rectTiles(13, 20, 2, 10, T.ROAD);
  rectTiles(34, 20, 2, 12, T.ROAD);
  rectTiles(18, 25, 17, 2, T.ROAD);
  rectTiles(20, 30, 8, 2, T.ROAD);
  rectTiles(17, 13, 13, 5, T.STONE);
  // Market square and mosque courtyard.
  rectTiles(29, 12, 12, 7, T.STONE);
  rectTiles(18, 11, 12, 7, T.STONE);
  // Farmland.
  rectTiles(36, 27, 8, 6, T.DIRT);
  for (let x = 36; x < 44; x += 2) rectTiles(x, 27, 1, 6, T.TILE);
  // Little oasis pond.
  for (let y = 4; y <= 11; y++) {
    for (let x = 4; x <= 13; x++) {
      const d = ((x - 8.5) ** 2) / 24 + ((y - 7.5) ** 2) / 12;
      if (d < 1) setTile(x, y, T.WATER);
    }
  }
  // A small stream at the eastern edge.
  for (let y = 21; y < 34; y++) {
    const x = 44 + (y % 5 === 0 ? 1 : 0);
    setTile(x, y, T.WATER);
  }
  // Bridge across the stream.
  rectTiles(42, 28, 4, 2, T.ROAD);

  const buildings = [
    { id: 'mosque', name: 'Masjid Al-Qamar', x: 19, y: 4, w: 8, h: 7, kind: 'mosque', interactX: 23 * TILE + 16, interactY: 12 * TILE + 12 },
    { id: 'house', name: 'Rumah keluarga Salim', x: 4, y: 23, w: 7, h: 5, kind: 'house', interactX: 7 * TILE + 16, interactY: 28 * TILE + 10 },
    { id: 'inn', name: 'Penginapan Safa', x: 38, y: 5, w: 7, h: 5, kind: 'inn', interactX: 41 * TILE + 16, interactY: 10 * TILE + 10 },
    { id: 'library', name: 'Rumah Ilmu', x: 3, y: 13, w: 6, h: 4, kind: 'library', interactX: 6 * TILE + 16, interactY: 17 * TILE + 8 },
  ];

  const stalls = [
    { x: 30, y: 13, w: 3, h: 3, color: '#b85d45', cloth: '#e5b36b' },
    { x: 34, y: 13, w: 3, h: 3, color: '#628a71', cloth: '#e7d09b' },
    { x: 38, y: 13, w: 3, h: 3, color: '#8b6a9a', cloth: '#e6b77e' },
  ];

  const trees = [
    [3,3],[15,3],[16,5],[31,4],[34,4],[46,4],[2,9],[15,8],[16,10],[28,4],
    [11,14],[14,14],[17,14],[28,22],[30,23],[32,23],[39,23],[42,23],[5,30],
    [10,32],[17,32],[29,33],[32,31],[45,17],[46,18],[3,21],[12,23],[17,23]
  ].map(([x,y],i)=>({x:x*TILE+16,y:y*TILE+18,variant:i%3}));

  const rocks = [[3,11],[14,6],[16,18],[28,29],[32,8],[42,11],[13,31],[45,31],[10,19],[30,5]];
  const cacti = [[11,3],[43,3],[2,29],[46,13],[32,33],[18,5]];

  const npcs = [
    { id:'merchant', name:'Yusuf', role:'Pedagang pasar', x:35*TILE+16, y:17*TILE+9, color:'#b9684e', accent:'#e6bd79', line:'Assalamu’alaikum! Pasar Nuraya selalu ramai. Silakan lihat barang daganganku.' },
    { id:'gardener', name:'Maryam', role:'Pekebun kurma', x:39*TILE+16, y:25*TILE+8, color:'#668b68', accent:'#e8cf9d', line:'Pohon kurma perlu dirawat dengan sabar. Sedikit demi sedikit, kebun ini akan berbuah.' },
    { id:'traveler', name:'Rafi', role:'Pengembara', x:14*TILE+16, y:18*TILE+8, color:'#547d91', accent:'#d9bd8e', line:'Aku baru tiba dari oasis di utara. Jalan di sana teduh dan penuh pohon kurma.' },
    { id:'guard', name:'Hassan', role:'Penjaga kota', x:24*TILE+16, y:31*TILE+8, color:'#9a7548', accent:'#e7c58c', line:'Selamat datang di Nuraya. Jaga kebersihan kota dan hormati sesama pengunjung, ya.' },
    { id:'scholar', name:'Amina', role:'Penjaga Rumah Ilmu', x:10*TILE+16, y:17*TILE+8, color:'#856b9e', accent:'#ead5a8', line:'Di Rumah Ilmu ada banyak kisah tentang bintang, perdagangan, geografi, dan sejarah.' },
  ];

  const interactables = [
    ...buildings.map(b=>({ id:b.id, name:b.name, x:b.interactX, y:b.interactY, type:b.id })),
    { id:'market', name:'Pasar Rempah Nuraya', x:35*TILE+16, y:18*TILE+12, type:'market' },
    { id:'well', name:'Sumur Oasis', x:15*TILE+16, y:24*TILE+16, type:'well' },
    { id:'board', name:'Papan Pengumuman', x:28*TILE+16, y:21*TILE+5, type:'board' },
    { id:'garden', name:'Kebun Kurma', x:40*TILE+16, y:27*TILE+4, type:'garden' },
    { id:'bridge', name:'Jembatan Timur', x:43*TILE+16, y:28*TILE+16, type:'bridge' },
  ];
  npcs.forEach(n=>interactables.push({ id:n.id, name:n.name, x:n.x, y:n.y, type:'npc', npc:n }));

  const player = { x:24*TILE+16, y:18*TILE+16, r:9, speed:132, dir:'down', moving:false, walk:0 };
  const camera = { x:0, y:0 };
  const keys = Object.create(null);
  const touchDirs = Object.create(null);
  let coins = 120;
  let inventory = [];
  let gameMinutes = 8*60;
  let day = 1;
  let lastFrame = 0;
  let activeTarget = null;
  let toastTimer = 0;
  let toastText = '';
  let modalOpen = false;
  let currentLocation = 'Kota Nuraya';
  let deliveredQuest = false;
  let dateItems = 0;

  const prayerTimes = [
    { name:'Subuh', time:5*60+20 },
    { name:'Zuhur', time:12*60+10 },
    { name:'Asar', time:15*60+25 },
    { name:'Magrib', time:18*60+5 },
    { name:'Isya', time:19*60+20 },
  ];
  const fmtTime = mins => `${String(Math.floor(mins/60)%24).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  function getNextPrayer() {
    const minute = gameMinutes % 1440;
    return prayerTimes.find(p=>p.time>minute) || prayerTimes[0];
  }

  const ui = {
    day:document.getElementById('dayLabel'), clock:document.getElementById('clockLabel'), prayer:document.getElementById('prayerLabel'),
    coins:document.getElementById('coinLabel'), itemCount:document.getElementById('itemCount'), location:document.getElementById('locationLabel'),
    hint:document.getElementById('interactionHint'), toast:document.getElementById('toast'), weather:document.getElementById('weatherIcon'),
    backdrop:document.getElementById('modalBackdrop'), title:document.getElementById('modalTitle'), eyebrow:document.getElementById('modalEyebrow'),
    content:document.getElementById('modalContent'), actions:document.getElementById('modalActions')
  };

  function showToast(message, seconds=2.7) {
    toastText = message;
    toastTimer = seconds;
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
  }
  function updateHud() {
    ui.day.textContent = day;
    ui.clock.textContent = fmtTime(gameMinutes % 1440);
    const next = getNextPrayer();
    ui.prayer.textContent = `${next.name} · ${fmtTime(next.time)}`;
    ui.coins.textContent = coins;
    ui.itemCount.textContent = inventory.reduce((sum,i)=>sum+i.qty,0);
    ui.location.textContent = currentLocation;
    const h = Math.floor((gameMinutes%1440)/60);
    ui.weather.textContent = h>=18 || h<5 ? '☾' : h>=16 ? '◒' : '☀';
  }

  function changeClock(delta) {
    const oldTotal = gameMinutes;
    const newTotal = gameMinutes + delta;
    for (let t=oldTotal+1; t<=newTotal; t++) {
      const minute = t%1440;
      const prayer = prayerTimes.find(p=>p.time===minute);
      if (prayer) showToast(`Waktu ${prayer.name} telah tiba. Masjid Al-Qamar berada di bagian utara kota.`, 4.5);
    }
    gameMinutes = newTotal;
    while (gameMinutes>=1440) { gameMinutes-=1440; day++; showToast(`Hari baru dimulai. Selamat datang di Hari ${day}!`,3.5); }
    updateHud();
  }

  function tileAtWorld(x,y) {
    const tx=Math.floor(x/TILE), ty=Math.floor(y/TILE);
    if (tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return T.SAND;
    return map[ty][tx];
  }

  function circleRectCollision(cx,cy,r,rect) {
    const nx=clamp(cx,rect.x,rect.x+rect.w), ny=clamp(cy,rect.y,rect.y+rect.h);
    return (cx-nx)**2+(cy-ny)**2<r*r;
  }
  const obstacleRects = [];
  // Building footprints leave a narrow doorway at the front.
  buildings.forEach(b=>{
    obstacleRects.push({x:b.x*TILE+5,y:b.y*TILE+25,w:b.w*TILE-10,h:b.h*TILE-48});
    obstacleRects.push({x:b.x*TILE+5,y:(b.y+b.h)*TILE-22,w:b.w*TILE/2-20,h:16});
    obstacleRects.push({x:b.x*TILE+b.w*TILE/2+15,y:(b.y+b.h)*TILE-22,w:b.w*TILE/2-20,h:16});
  });
  stalls.forEach(s=>obstacleRects.push({x:s.x*TILE+5,y:s.y*TILE+22,w:s.w*TILE-10,h:s.h*TILE-22}));
  trees.forEach(t=>obstacleRects.push({x:t.x-11,y:t.y+2,w:22,h:18}));
  rocks.forEach(([x,y])=>obstacleRects.push({x:x*TILE+7,y:y*TILE+8,w:18,h:17}));
  cacti.forEach(([x,y])=>obstacleRects.push({x:x*TILE+9,y:y*TILE+5,w:14,h:23}));
  obstacleRects.push({x:14*TILE+4,y:23*TILE+4,w:24,h:24}); // well

  function collides(x,y) {
    const samples=[[x-player.r,y-player.r],[x+player.r,y-player.r],[x-player.r,y+player.r],[x+player.r,y+player.r],[x,y]];
    if (samples.some(([sx,sy])=>tileAtWorld(sx,sy)===T.WATER)) return true;
    return obstacleRects.some(r=>circleRectCollision(x,y,player.r,r));
  }
  function movePlayer(dx,dy) {
    const nx=player.x+dx, ny=player.y+dy;
    if (!collides(nx,player.y)) player.x=nx;
    if (!collides(player.x,ny)) player.y=ny;
  }

  function drawGroundTile(x,y,screenX,screenY) {
    const type=map[y][x];
    const r=rand(x,y,1);
    if(type===T.GRASS) {
      ctx.fillStyle=r>.55?'#72965e':'#789d63';
      ctx.fillRect(screenX,screenY,TILE,TILE);
      ctx.fillStyle='rgba(36,75,46,.16)';
      if(r>.35) ctx.fillRect(screenX+4+Math.floor(r*12),screenY+7,TILE%3+2,2);
      if(r<.16) { ctx.fillStyle='#b7bd76';ctx.fillRect(screenX+22,screenY+21,2,2); }
    } else if(type===T.SAND) {
      ctx.fillStyle=r>.5?'#d8b77b':'#d3af70';ctx.fillRect(screenX,screenY,TILE,TILE);
      ctx.fillStyle='rgba(132,91,48,.2)';ctx.fillRect(screenX+5+Math.floor(r*10),screenY+8,3,1);ctx.fillRect(screenX+20,screenY+25,2,1);
    } else if(type===T.ROAD) {
      ctx.fillStyle=r>.5?'#c69c65':'#c19a63';ctx.fillRect(screenX,screenY,TILE,TILE);
      ctx.fillStyle='rgba(104,75,46,.19)';ctx.fillRect(screenX+4,screenY+7,2,2);ctx.fillRect(screenX+23,screenY+22,3,2);
    } else if(type===T.STONE) {
      ctx.fillStyle='#c9b88e';ctx.fillRect(screenX,screenY,TILE,TILE);
      ctx.strokeStyle='rgba(103,95,73,.22)';ctx.lineWidth=1;ctx.strokeRect(screenX+.5,screenY+.5,TILE-1,TILE-1);
      ctx.fillStyle='rgba(255,244,211,.16)';ctx.fillRect(screenX+3,screenY+3,7,1);
    } else if(type===T.WATER) {
      ctx.fillStyle='#4e91a0';ctx.fillRect(screenX,screenY,TILE,TILE);
      ctx.fillStyle='rgba(197,232,215,.26)';ctx.fillRect(screenX+5+Math.floor(r*10),screenY+8,8,2);ctx.fillRect(screenX+17,screenY+22,7,2);
      ctx.fillStyle='rgba(26,82,99,.22)';ctx.fillRect(screenX,screenY+29,TILE,3);
    } else if(type===T.DIRT) {
      ctx.fillStyle='#a9804e';ctx.fillRect(screenX,screenY,TILE,TILE);
      ctx.fillStyle='rgba(70,48,32,.2)';ctx.fillRect(screenX+4,screenY+8,3,2);ctx.fillRect(screenX+21,screenY+21,4,2);
    } else {
      ctx.fillStyle='#937c59';ctx.fillRect(screenX,screenY,TILE,TILE);
    }
  }

  function drawPalm(x,y,variant=0) {
    const sx=Math.round(x-camera.x), sy=Math.round(y-camera.y);
    // Ground shadow
    ctx.fillStyle='rgba(44,49,29,.22)';ctx.fillRect(sx-12,sy+6,25,7);
    // Trunk
    ctx.fillStyle='#805536';ctx.fillRect(sx-4,sy-15,8,24);ctx.fillStyle='#a87849';ctx.fillRect(sx-2,sy-14,3,21);
    // Pixel fronds
    const greens=['#3f7550','#4e8957','#65985c'];
    ctx.fillStyle=greens[variant];
    ctx.fillRect(sx-3,sy-28,6,12);ctx.fillRect(sx-17,sy-25,15,5);ctx.fillRect(sx+3,sy-25,15,5);
    ctx.fillRect(sx-13,sy-33,8,6);ctx.fillRect(sx+5,sy-33,8,6);
    ctx.fillRect(sx-19,sy-21,7,4);ctx.fillRect(sx+12,sy-21,7,4);
    ctx.fillStyle='#82aa65';ctx.fillRect(sx-2,sy-30,4,4);ctx.fillRect(sx-12,sy-32,6,2);ctx.fillRect(sx+8,sy-32,6,2);
    if(variant===1){ctx.fillStyle='#c58a45';ctx.fillRect(sx+4,sy-13,3,5);ctx.fillRect(sx+7,sy-12,3,4);}
  }

  function drawCactus(x,y) {
    const sx=x*TILE-camera.x+16, sy=y*TILE-camera.y+21;
    ctx.fillStyle='rgba(43,52,31,.18)';ctx.fillRect(sx-9,sy+5,19,4);
    ctx.fillStyle='#3c7851';ctx.fillRect(sx-4,sy-12,8,18);ctx.fillRect(sx-10,sy-6,6,8);ctx.fillRect(sx+4,sy-2,7,6);
    ctx.fillStyle='#6ea46b';ctx.fillRect(sx-2,sy-10,2,13);ctx.fillRect(sx-8,sy-4,2,4);
  }

  function drawRock(x,y) {
    const sx=x*TILE-camera.x+16, sy=y*TILE-camera.y+19;
    ctx.fillStyle='rgba(40,49,38,.18)';ctx.fillRect(sx-10,sy+5,21,4);
    ctx.fillStyle='#8e9580';ctx.fillRect(sx-9,sy-3,18,9);ctx.fillRect(sx-6,sy-7,12,5);
    ctx.fillStyle='#b5b59a';ctx.fillRect(sx-5,sy-5,6,3);ctx.fillStyle='#727c6c';ctx.fillRect(sx+4,sy,4,4);
  }

  function drawMosque(b) {
    const x=b.x*TILE-camera.x, y=b.y*TILE-camera.y, w=b.w*TILE, h=b.h*TILE;
    ctx.fillStyle='rgba(51,47,34,.25)';ctx.fillRect(x+12,y+h-8,w-22,14);
    // Main walls and lower foundation
    ctx.fillStyle='#d8c79f';ctx.fillRect(x+19,y+45,w-38,h-46);
    ctx.fillStyle='#b49c70';ctx.fillRect(x+14,y+h-17,w-28,12);
    // Side wings
    ctx.fillStyle='#e7d7b1';ctx.fillRect(x+4,y+69,26,h-70);ctx.fillRect(x+w-30,y+69,26,h-70);
    // Main dome
    ctx.fillStyle='#3d8878';ctx.fillRect(x+w/2-39,y+18,78,31);ctx.fillRect(x+w/2-33,y+9,66,14);ctx.fillRect(x+w/2-23,y+3,46,9);
    ctx.fillStyle='#76ad91';ctx.fillRect(x+w/2-24,y+8,18,5);ctx.fillStyle='#d9b66d';ctx.fillRect(x+w/2-2,y-1,4,7);ctx.fillRect(x+w/2-7,y+4,14,2);
    // Minaret towers
    for(const tx of [x+9,x+w-25]) {
      ctx.fillStyle='#e7d9b7';ctx.fillRect(tx,y+17,16,100);ctx.fillStyle='#b69a6b';ctx.fillRect(tx-3,y+48,22,5);
      ctx.fillStyle='#3d8878';ctx.fillRect(tx-2,y+11,20,10);ctx.fillRect(tx+2,y+4,12,8);ctx.fillStyle='#e4c078';ctx.fillRect(tx+7,y,2,5);
      ctx.fillStyle='#6e5840';ctx.fillRect(tx+5,y+72,6,15);
    }
    // Arched windows
    for(const wx of [x+49,x+w-63]) {
      ctx.fillStyle='#557f78';ctx.fillRect(wx,y+73,13,23);ctx.fillRect(wx+3,y+68,7,6);ctx.fillStyle='#e8d8b5';ctx.fillRect(wx+5,y+71,2,22);
    }
    // Entrance
    ctx.fillStyle='#654e3b';ctx.fillRect(x+w/2-13,y+h-51,26,42);ctx.fillStyle='#c69c59';ctx.fillRect(x+w/2-3,y+h-42,2,31);
    ctx.fillStyle='#e3d4b0';ctx.fillRect(x+36,y+51,w-72,4);
  }

  function drawHouse(b) {
    const x=b.x*TILE-camera.x, y=b.y*TILE-camera.y, w=b.w*TILE, h=b.h*TILE;
    ctx.fillStyle='rgba(44,38,28,.24)';ctx.fillRect(x+9,y+h-12,w-14,14);
    ctx.fillStyle='#e5cf9e';ctx.fillRect(x+12,y+32,w-24,h-43);
    ctx.fillStyle='#bc7650';ctx.fillRect(x+4,y+25,w-8,17);ctx.fillRect(x+11,y+13,w-22,15);ctx.fillRect(x+20,y+5,w-40,10);
    ctx.fillStyle='#8f563f';ctx.fillRect(x+10,y+37,w-20,5);
    ctx.fillStyle='#597c75';ctx.fillRect(x+27,y+49,20,22);ctx.fillRect(x+w-49,y+49,20,22);
    ctx.fillStyle='#e8d5a9';ctx.fillRect(x+34,y+51,5,18);ctx.fillRect(x+w-42,y+51,5,18);
    ctx.fillStyle='#624b38';ctx.fillRect(x+w/2-9,y+h-42,18,31);ctx.fillStyle='#d6ad69';ctx.fillRect(x+w/2+4,y+h-26,2,2);
  }

  function drawLibrary(b) {
    const x=b.x*TILE-camera.x, y=b.y*TILE-camera.y, w=b.w*TILE, h=b.h*TILE;
    ctx.fillStyle='rgba(44,38,28,.24)';ctx.fillRect(x+8,y+h-8,w-15,12);
    ctx.fillStyle='#e0d0a9';ctx.fillRect(x+10,y+28,w-20,h-38);
    ctx.fillStyle='#6a8c7a';ctx.fillRect(x+2,y+20,w-4,16);ctx.fillRect(x+14,y+9,w-28,13);
    ctx.fillStyle='#456c60';ctx.fillRect(x+22,y+42,20,25);ctx.fillRect(x+w-42,y+42,20,25);
    ctx.fillStyle='#d1b77d';ctx.fillRect(x+25,y+47,14,3);ctx.fillRect(x+w-39,y+47,14,3);
    ctx.fillStyle='#634a35';ctx.fillRect(x+w/2-8,y+h-40,16,28);
  }

  function drawInn(b) {
    const x=b.x*TILE-camera.x, y=b.y*TILE-camera.y, w=b.w*TILE, h=b.h*TILE;
    ctx.fillStyle='rgba(44,38,28,.24)';ctx.fillRect(x+8,y+h-8,w-15,12);
    ctx.fillStyle='#e5d2a7';ctx.fillRect(x+11,y+33,w-22,h-42);
    ctx.fillStyle='#b7774b';ctx.fillRect(x+4,y+26,w-8,17);ctx.fillRect(x+15,y+13,w-30,15);ctx.fillRect(x+26,y+4,w-52,11);
    ctx.fillStyle='#597a72';ctx.fillRect(x+25,y+48,19,18);ctx.fillRect(x+w-44,y+48,19,18);
    ctx.fillStyle='#6b4b35';ctx.fillRect(x+w/2-9,y+h-40,18,29);
    ctx.fillStyle='#e4bb71';ctx.fillRect(x+w/2-2,y+45,4,5);
  }

  function drawStall(s, i) {
    const x=s.x*TILE-camera.x, y=s.y*TILE-camera.y, w=s.w*TILE, h=s.h*TILE;
    ctx.fillStyle='rgba(39,37,27,.22)';ctx.fillRect(x+4,y+h-3,w-5,8);
    ctx.fillStyle='#76533b';ctx.fillRect(x+8,y+28,w-16,h-28);
    ctx.fillStyle=s.color;ctx.fillRect(x+2,y+8,w-4,22);
    for(let k=0;k<4;k++) { ctx.fillStyle=k%2===0?s.cloth:'#f2dfb5';ctx.fillRect(x+2+k*(w-4)/4,y+8,(w-4)/4,22); }
    ctx.fillStyle='#d5b477';ctx.fillRect(x+5,y+29,w-10,4);
    // colorful goods on the counter
    const goods=['#b95d45','#d7a64f','#6b9a72','#a76d88'];
    for(let k=0;k<4;k++){ctx.fillStyle=goods[(k+i)%goods.length];ctx.fillRect(x+12+k*18,y+34,8,7);}
  }

  function drawWell() {
    const x=15*TILE-camera.x+16, y=24*TILE-camera.y+16;
    ctx.fillStyle='rgba(40,40,28,.22)';ctx.fillRect(x-16,y+9,33,7);
    ctx.fillStyle='#a99a78';ctx.fillRect(x-14,y-8,28,17);ctx.fillStyle='#d5c49a';ctx.fillRect(x-11,y-12,22,7);
    ctx.fillStyle='#4f8e98';ctx.fillRect(x-8,y-5,16,9);ctx.fillStyle='#d7c69e';ctx.fillRect(x-17,y-14,34,5);
    ctx.fillStyle='#79583c';ctx.fillRect(x-2,y-28,4,17);ctx.fillRect(x-14,y-28,28,3);ctx.fillStyle='#c69e62';ctx.fillRect(x+9,y-28,3,15);
  }

  function drawGarden() {
    for(let row=0;row<3;row++) for(let col=0;col<4;col++) {
      const x=37+col*2, y=28+row*1.4;
      const sx=x*TILE-camera.x, sy=y*TILE-camera.y;
      ctx.fillStyle='#715438';ctx.fillRect(sx+4,sy+14,24,7);
      ctx.fillStyle='#467a4c';ctx.fillRect(sx+11,sy+4,10,13);ctx.fillRect(sx+7,sy+8,18,5);
      ctx.fillStyle='#7eae62';ctx.fillRect(sx+13,sy+5,5,3);
      if((row+col)%3===0){ctx.fillStyle='#d1a24d';ctx.fillRect(sx+18,sy+10,4,4);}
    }
  }

  function drawDecoration() {
    trees.forEach(t=>drawPalm(t.x,t.y,t.variant));
    rocks.forEach(([x,y])=>drawRock(x,y));
    cacti.forEach(([x,y])=>drawCactus(x,y));
    // Low bushes and flower specks.
    for(let y=3;y<34;y++) for(let x=3;x<45;x++) {
      if(rand(x,y,8)>.986 && map[y][x]===T.GRASS && !(x>18&&x<28&&y>10&&y<22)) {
        const sx=x*TILE-camera.x+12, sy=y*TILE-camera.y+18;
        ctx.fillStyle='#4f8154';ctx.fillRect(sx-4,sy-2,8,5);ctx.fillStyle='#91a96a';ctx.fillRect(sx-2,sy-4,4,3);
      }
      if(rand(x,y,9)>.994 && map[y][x]===T.GRASS) {
        const sx=x*TILE-camera.x+18, sy=y*TILE-camera.y+17;ctx.fillStyle='#e4c27d';ctx.fillRect(sx,sy,2,2);
      }
    }
  }

  function drawNPC(n, time) {
    const sx=Math.round(n.x-camera.x), sy=Math.round(n.y-camera.y);
    const bob=Math.sin(time/480+n.x)*1.1;
    ctx.fillStyle='rgba(36,39,26,.2)';ctx.fillRect(sx-8,sy+7,16,5);
    // robe body
    ctx.fillStyle=n.color;ctx.fillRect(sx-7,sy-3+bob,14,13);ctx.fillRect(sx-9,sy+1+bob,18,7);
    ctx.fillStyle=n.accent;ctx.fillRect(sx-2,sy-1+bob,4,12);
    // head and cap
    ctx.fillStyle='#9b6547';ctx.fillRect(sx-5,sy-13+bob,10,10);ctx.fillStyle='#392e28';ctx.fillRect(sx-5,sy-15+bob,10,4);
    ctx.fillStyle='#e6d4ad';ctx.fillRect(sx-7,sy-17+bob,14,4);ctx.fillRect(sx-5,sy-19+bob,10,3);
    ctx.fillStyle='#2c2b25';ctx.fillRect(sx-3,sy-9+bob,2,2);ctx.fillRect(sx+2,sy-9+bob,2,2);
  }

  function drawPlayer(time) {
    const sx=Math.round(player.x-camera.x), sy=Math.round(player.y-camera.y);
    const bob=player.moving?Math.abs(Math.sin(player.walk))*2:0;
    const step=player.moving?Math.sin(player.walk*1.1)*2:0;
    ctx.fillStyle='rgba(31,38,25,.27)';ctx.fillRect(sx-10,sy+8,20,6);
    // feet
    ctx.fillStyle='#604632';ctx.fillRect(sx-7+step,sy+7-bob,5,4);ctx.fillRect(sx+2-step,sy+7-bob,5,4);
    // robe
    ctx.fillStyle='#397c71';ctx.fillRect(sx-8,sy-3-bob,16,14);ctx.fillRect(sx-10,sy+2-bob,20,7);
    ctx.fillStyle='#d9b66f';ctx.fillRect(sx-2,sy-2-bob,4,13);
    // arms
    ctx.fillStyle='#b77954';ctx.fillRect(sx-11,sy+1-bob,3,7);ctx.fillRect(sx+8,sy+1-bob,3,7);
    // face & head wrap; face shifts subtly with facing
    ctx.fillStyle='#a96f50';ctx.fillRect(sx-6,sy-15-bob,12,11);
    ctx.fillStyle='#ead9b5';ctx.fillRect(sx-8,sy-18-bob,16,6);ctx.fillRect(sx-6,sy-21-bob,12,4);
    ctx.fillStyle='#44352b';ctx.fillRect(sx-6,sy-16-bob,12,3);
    ctx.fillStyle='#302e27';
    if(player.dir==='down'){ctx.fillRect(sx-3,sy-9-bob,2,2);ctx.fillRect(sx+2,sy-9-bob,2,2);}
    else if(player.dir==='left'){ctx.fillRect(sx-5,sy-10-bob,2,2);}
    else if(player.dir==='right'){ctx.fillRect(sx+3,sy-10-bob,2,2);}
    // little shoulder satchel
    ctx.fillStyle='#a66d43';ctx.fillRect(sx+6,sy-1-bob,5,7);ctx.fillStyle='#dfb66c';ctx.fillRect(sx+7,sy,3,2);
  }

  function drawWorld(time) {
    ctx.clearRect(0,0,VIEW_W,VIEW_H);
    const startX=clamp(Math.floor(camera.x/TILE),0,MAP_W-1), startY=clamp(Math.floor(camera.y/TILE),0,MAP_H-1);
    const endX=clamp(Math.ceil((camera.x+VIEW_W)/TILE)+1,0,MAP_W), endY=clamp(Math.ceil((camera.y+VIEW_H)/TILE)+1,0,MAP_H);
    for(let y=startY;y<endY;y++) for(let x=startX;x<endX;x++) drawGroundTile(x,y,Math.floor(x*TILE-camera.x),Math.floor(y*TILE-camera.y));
    drawDecoration();
    buildings.forEach(b=>{
      if(b.kind==='mosque') drawMosque(b);
      else if(b.kind==='house') drawHouse(b);
      else if(b.kind==='library') drawLibrary(b);
      else drawInn(b);
    });
    stalls.forEach(drawStall);
    drawWell();
    drawGarden();
    // Board sign near the plaza.
    let bx=28*TILE-camera.x+16, by=21*TILE-camera.y+8;
    ctx.fillStyle='#684a33';ctx.fillRect(bx-3,by-3,6,23);ctx.fillStyle='#bd9257';ctx.fillRect(bx-14,by-13,28,14);ctx.fillStyle='#73563a';ctx.fillRect(bx-9,by-8,18,2);ctx.fillRect(bx-9,by-3,13,2);
    // draw NPCs and player in their world-depth order
    const actors=[...npcs.map(n=>({y:n.y,draw:()=>drawNPC(n,time)})),{y:player.y,draw:()=>drawPlayer(time)}].sort((a,b)=>a.y-b.y);
    actors.forEach(a=>a.draw());
    // Time-of-day tint.
    const minutes=gameMinutes%1440, hour=minutes/60;
    let alpha=0;
    if(hour<5.5) alpha=.43;
    else if(hour<7) alpha=.43*(7-hour)/1.5;
    else if(hour>18.5) alpha=Math.min(.48,(hour-18.5)/3.5*.48);
    if(alpha>0){ctx.fillStyle=`rgba(23,35,63,${alpha})`;ctx.fillRect(0,0,VIEW_W,VIEW_H);}
    if(hour>=16.5&&hour<=18.5){const a=.07*Math.sin((hour-16.5)/2*Math.PI);ctx.fillStyle=`rgba(218,126,65,${a})`;ctx.fillRect(0,0,VIEW_W,VIEW_H);}
  }

  function drawMinimap() {
    const sx=mini.width/MAP_W, sy=mini.height/MAP_H;
    mctx.clearRect(0,0,mini.width,mini.height);
    const colors={ [T.SAND]:'#c9a66b',[T.GRASS]:'#6e965e',[T.ROAD]:'#b88f5a',[T.STONE]:'#c6b58a',[T.WATER]:'#4d91a0',[T.DIRT]:'#997246',[T.TILE]:'#7b6040' };
    for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++){mctx.fillStyle=colors[map[y][x]];mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));}
    // Main building landmarks.
    mctx.fillStyle='#d9d0ad';mctx.fillRect(19*sx,4*sy,8*sx,7*sy);
    mctx.fillStyle='#b87851';mctx.fillRect(4*sx,23*sy,7*sx,5*sy);mctx.fillRect(38*sx,5*sy,7*sx,5*sy);
    mctx.fillStyle='#e6c77f';mctx.fillRect(30*sx,13*sy,11*sx,3*sy);
    mctx.fillStyle='#fff2c8';mctx.fillRect((player.x/WORLD_W)*mini.width-2,(player.y/WORLD_H)*mini.height-2,4,4);
    mctx.strokeStyle='rgba(255,255,255,.7)';mctx.lineWidth=1;mctx.strokeRect(0,0,mini.width,mini.height);
  }

  function getNearestTarget() {
    let best=null, bestD=Infinity;
    for(const t of interactables){
      const d=Math.hypot(player.x-t.x,player.y-t.y);
      const max=t.type==='npc'?45:52;
      if(d<max && d<bestD){best=t;bestD=d;}
    }
    return best;
  }

  function openModal(title, content, actions=[], eyebrow='JEJAK NUR') {
    modalOpen=true;ui.eyebrow.textContent=eyebrow;ui.title.textContent=title;ui.content.innerHTML=content;ui.actions.innerHTML='';
    for(const action of actions){
      const button=document.createElement('button');button.type='button';button.className=`modal-action ${action.secondary?'secondary':''}`;button.textContent=action.label;
      button.addEventListener('click',()=>{if(action.run) action.run();});ui.actions.appendChild(button);
    }
    ui.backdrop.hidden=false;
  }
  function closeModal(){modalOpen=false;ui.backdrop.hidden=true;}

  const goods = [
    {id:'dates',name:'Kurma pilihan',desc:'Buah manis dari kebun oasis.',price:18},
    {id:'bread',name:'Roti hangat',desc:'Bekal sederhana untuk perjalanan.',price:12},
    {id:'herbs',name:'Rempah wangi',desc:'Campuran rempah khas Nuraya.',price:24},
    {id:'water',name:'Air minum',desc:'Air segar untuk perjalanan.',price:8},
  ];
  function addItem(id,name,qty=1){const item=inventory.find(i=>i.id===id);if(item)item.qty+=qty;else inventory.push({id,name,qty});}
  function openMarket() {
    const rows=goods.map(g=>`<div class="shop-row"><div><span class="shop-item-name">${g.name}</span><span class="shop-item-desc">${g.desc}</span></div><button class="shop-buy" data-buy="${g.id}">◈ ${g.price}</button></div>`).join('');
    openModal('Pasar Rempah Nuraya',`<p>Yusuf menyambutmu di kiosnya. Pilih barang yang ingin dibeli. Setiap barang akan masuk ke dalam tasmu.</p><div id="shopList">${rows}</div><p style="font-size:11px;color:#e6c78b;margin-top:9px">Uangmu: <b id="shopCoins">${coins} koin</b></p>`,[{label:'Selesai',secondary:true,run:closeModal}],'PERDAGANGAN');
    ui.content.querySelectorAll('[data-buy]').forEach(button=>button.addEventListener('click',()=>{
      const item=goods.find(g=>g.id===button.dataset.buy);if(!item)return;
      if(coins<item.price){showToast('Koinmu belum cukup untuk membeli barang itu.');return;}
      coins-=item.price;addItem(item.id,item.name);updateHud();
      const coinNode=ui.content.querySelector('#shopCoins');if(coinNode)coinNode.textContent=`${coins} koin`;
      showToast(`${item.name} masuk ke dalam tas.`);
    }));
  }
  function openInventory() {
    const rows=inventory.map(i=>`<div class="inventory-row"><span class="shop-item-name">${i.name}</span><b>× ${i.qty}</b></div>`).join('');
    openModal('Tas perjalanan',inventory.length?`<p>Barang-barang yang sedang kamu bawa:</p>${rows}`:'<div class="empty-note">Tasmu masih kosong. Coba kunjungi Pasar Rempah Nuraya untuk membeli bekal.</div>',[{label:'Tutup',secondary:true,run:closeModal}],'INVENTARIS');
  }
  function openJournal() {
    const quest=deliveredQuest?'Selesai — kamu telah membantu Yusuf mengantarkan kurma.':'Belum selesai — belilah kurma di pasar, lalu bawa ke Maryam di kebun.';
    openModal('Jurnal perjalanan',`<p><b>Tujuan kecil: Bantuan untuk kebun kurma</b></p><p>Yusuf ingin mengenalkan kurma dari kebun Maryam kepada para pengunjung pasar. Belilah satu paket kurma dari kios Yusuf, lalu temui Maryam di kebun bagian tenggara kota.</p><p><b>Status:</b> ${quest}</p><p style="color:#a9c1aa;font-size:11px">Petunjuk: dekati seseorang atau tempat, lalu tekan E (atau tombol INTERAKSI).</p>`,[{label:'Mengerti',secondary:true,run:closeModal}],'JURNAL');
  }

  function interact(target) {
    if(!target)return;
    switch(target.type){
      case 'npc': {
        const n=target.npc;
        let extra='';
        if(n.id==='merchant') extra='<p>“Kalau butuh bekal perjalanan, lihat barang daganganku di kios sebelah.”</p>';
        if(n.id==='gardener') extra='<p>“Aku sedang merawat kebun. Kurma yang baik tumbuh dari perawatan yang tekun.”</p>';
        openModal(n.name,`<p style="color:#dbbd84;font-size:11px;font-weight:700">${n.role}</p><p>${n.line}</p>${extra}`,[{label:'Lanjutkan perjalanan',secondary:true,run:closeModal}],'PERCAKAPAN');
        if(n.id==='gardener'&&!deliveredQuest&&inventory.some(i=>i.id==='dates'&&i.qty>0)){
          ui.actions.innerHTML='';
          const deliver=document.createElement('button');deliver.className='modal-action';deliver.textContent='Berikan kurma';deliver.onclick=()=>{
            const item=inventory.find(i=>i.id==='dates');item.qty--;if(item.qty<=0)inventory=inventory.filter(i=>i.id!=='dates');
            deliveredQuest=true;coins+=35;updateHud();showToast('Maryam berterima kasih. Kamu mendapat 35 koin!');
            openModal('Terima kasih!', '<p>“Terima kasih sudah membantu. Semoga perjalananmu menyenangkan!”</p><p><b>Hadiah: 35 koin</b></p>',[{label:'Sama-sama',secondary:true,run:closeModal}],'MISI SELESAI');
          };ui.actions.appendChild(deliver);
          const later=document.createElement('button');later.className='modal-action secondary';later.textContent='Nanti saja';later.onclick=closeModal;ui.actions.appendChild(later);
        }
        break;
      }
      case 'mosque':
        openModal('Masjid Al-Qamar','<p>Masjid berkubah hijau ini adalah tempat berkumpul warga Nuraya untuk beribadah dan belajar bersama.</p><p>Di dalam game, kamu dapat menjadikan masjid sebagai penanda kegiatan harian. Pengingat waktu salat mengikuti jam simulasi permainan.</p>',[{label:'Tutup',secondary:true,run:closeModal}],'TEMPAT IBADAH');
        break;
      case 'market': openMarket(); break;
      case 'well':
        openModal('Sumur Oasis','<p>Air sumur yang jernih menjadi sumber kehidupan bagi warga kota. Kamu berhenti sejenak menikmati suasana yang teduh.</p><p>Energi perjalananmu terasa pulih. (Fitur energi akan dikembangkan pada versi berikutnya.)</p>',[{label:'Lanjut',secondary:true,run:closeModal}],'TITIK ISTIRAHAT');
        break;
      case 'board': openJournal(); break;
      case 'garden':
        openModal('Kebun Kurma','<p>Barisan pohon kurma tumbuh di tanah subur dekat aliran air. Maryam biasanya berada di sekitar kebun ini.</p>',[{label:'Tutup',secondary:true,run:closeModal}],'AREA KEBUN');
        break;
      case 'bridge':
        openModal('Jembatan Timur','<p>Jembatan kayu kecil menghubungkan kebun dengan jalur di sisi timur kota. Dari sini, kamu bisa melihat aliran air oasis.</p>',[{label:'Tutup',secondary:true,run:closeModal}],'PENJELAJAHAN');
        break;
      case 'inn':
        openModal('Penginapan Safa','<p>Penginapan sederhana untuk para pedagang dan pengembara. Pemiliknya sedang berada di luar, tetapi kamu bisa beristirahat di sini pada pembaruan selanjutnya.</p>',[{label:'Tutup',secondary:true,run:closeModal}],'PENGINAPAN');
        break;
      case 'library':
        openModal('Rumah Ilmu','<p>Rak-rak buku memenuhi ruangan. Warga datang untuk membaca tentang ilmu pengetahuan, perjalanan, sejarah, dan banyak hal lainnya.</p>',[{label:'Tutup',secondary:true,run:closeModal}],'PERPUSTAKAAN');
        break;
      case 'house':
        openModal('Rumah warga','<p>Rumah mungil dengan halaman yang rapi. Tempat tinggal warga Nuraya.</p>',[{label:'Tutup',secondary:true,run:closeModal}],'LINGKUNGAN');
        break;
    }
  }

  function saveGame() {
    const data={x:player.x,y:player.y,coins,inventory,gameMinutes,day,deliveredQuest};
    try{localStorage.setItem('jejakNurSaveV1',JSON.stringify(data));showToast('Progres tersimpan di browser ini.');}
    catch(e){showToast('Penyimpanan tidak tersedia di browser ini.');}
  }
  function loadGame() {
    try {
      const raw=localStorage.getItem('jejakNurSaveV1');if(!raw)return;
      const d=JSON.parse(raw);
      if(Number.isFinite(d.x)&&Number.isFinite(d.y)){player.x=clamp(d.x, TILE, WORLD_W-TILE);player.y=clamp(d.y,TILE,WORLD_H-TILE);}
      if(Number.isFinite(d.coins))coins=d.coins;
      if(Array.isArray(d.inventory))inventory=d.inventory;
      if(Number.isFinite(d.gameMinutes))gameMinutes=d.gameMinutes;
      if(Number.isFinite(d.day))day=d.day;
      deliveredQuest=!!d.deliveredQuest;
      updateHud();
    }catch(e){console.warn('Save data could not be loaded.',e);}
  }

  function updateLocation() {
    const x=player.x/TILE,y=player.y/TILE;
    let loc='Kota Nuraya';
    if(x>18&&x<29&&y<13)loc='Kompleks Masjid Al-Qamar';
    else if(x>29&&x<43&&y>11&&y<20)loc='Pasar Rempah Nuraya';
    else if(x>35&&y>25)loc='Kebun Kurma';
    else if(x<13&&y<12)loc='Oasis Utara';
    else if(x<12&&y>21)loc='Permukiman Lama';
    else if(x>37&&y<12)loc='Penginapan Safa';
    else if(x<11&&y>12&&y<19)loc='Rumah Ilmu';
    if(loc!==currentLocation){currentLocation=loc;ui.location.textContent=loc;}
  }

  function setDirectionFromKeys() {
    let dx=0,dy=0;
    if(keys.ArrowLeft||keys.a||touchDirs.left)dx--;
    if(keys.ArrowRight||keys.d||touchDirs.right)dx++;
    if(keys.ArrowUp||keys.w||touchDirs.up)dy--;
    if(keys.ArrowDown||keys.s||touchDirs.down)dy++;
    if(dx&&dy){dx*=Math.SQRT1_2;dy*=Math.SQRT1_2;}
    if(dx||dy){
      if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right';else player.dir=dy<0?'up':'down';
    }
    return {dx,dy};
  }

  function update(dt) {
    if(!modalOpen){
      const {dx,dy}=setDirectionFromKeys();
      player.moving=!!(dx||dy);
      if(player.moving){movePlayer(dx*player.speed*dt,dy*player.speed*dt);player.walk+=dt*12;}
      changeClock(dt*2.2);
    } else player.moving=false;
    camera.x=clamp(player.x-VIEW_W/2,0,WORLD_W-VIEW_W);
    camera.y=clamp(player.y-VIEW_H/2,0,WORLD_H-VIEW_H);
    activeTarget=modalOpen?null:getNearestTarget();
    ui.hint.classList.toggle('visible',!!activeTarget&&!modalOpen);
    updateLocation();
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show');}
  }

  function frame(timestamp) {
    const dt=Math.min(.04,(timestamp-lastFrame)/1000||0);lastFrame=timestamp;
    update(dt);drawWorld(timestamp);drawMinimap();requestAnimationFrame(frame);
  }

  function doInteract(){if(modalOpen)return;if(activeTarget)interact(activeTarget);else showToast('Belum ada orang atau tempat di dekatmu.');}
  function showHelp(){
    openModal('Cara bermain','<p><b>Bergerak:</b> gunakan tombol WASD atau tombol panah.</p><p><b>Interaksi:</b> dekati penduduk atau tempat yang ditandai, lalu tekan E. Di ponsel, gunakan tombol arah dan tombol INTERAKSI.</p><p><b>Jelajah:</b> kamera mengikuti karakter. Peta mini di kanan atas menunjukkan posisi kamu di kota.</p><p><b>Waktu:</b> waktu berjalan lebih cepat dari waktu nyata. Pengingat salat menggunakan jadwal simulasi di dalam game.</p><p><b>Simpan:</b> tekan ikon kotak di kanan atas untuk menyimpan progres pada browser ini.</p>',[{label:'Mulai menjelajah',run:closeModal}],'PANDUAN');
  }

  window.addEventListener('keydown',e=>{
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    if(e.key==='Escape'&&modalOpen){closeModal();return;}
    if((key==='e'||e.key==='Enter')&&!e.repeat){doInteract();return;}
    if(key==='i'&&!e.repeat){openInventory();return;}
    if(key==='j'&&!e.repeat){openJournal();return;}
    if(key==='h'&&!e.repeat){showHelp();return;}
    keys[key]=true;
  });
  window.addEventListener('keyup',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;keys[key]=false;});
  window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);Object.keys(touchDirs).forEach(k=>touchDirs[k]=false);});
  document.querySelectorAll('[data-dir]').forEach(button=>{
    const dir=button.dataset.dir;
    const start=e=>{e.preventDefault();touchDirs[dir]=true;};
    const end=e=>{e.preventDefault();touchDirs[dir]=false;};
    button.addEventListener('pointerdown',start);button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('pointerleave',end);
  });
  document.getElementById('mobileInteract').addEventListener('click',doInteract);
  document.getElementById('helpButton').addEventListener('click',showHelp);
  document.getElementById('saveButton').addEventListener('click',saveGame);
  document.getElementById('bagButton').addEventListener('click',openInventory);
  document.getElementById('journalButton').addEventListener('click',openJournal);
  document.getElementById('modalClose').addEventListener('click',closeModal);
  ui.backdrop.addEventListener('click',e=>{if(e.target===ui.backdrop)closeModal();});

  loadGame();
  updateHud();
  showToast('Selamat datang di Nuraya! Jelajahi kota dan temui penduduknya.',4);
  requestAnimationFrame(frame);
})();
