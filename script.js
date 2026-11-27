(() => {
  'use strict';

  // JEJAK NUR — playable browser prototype, version 0.3
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const mini = document.getElementById('minimap');
  const mctx = mini.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  mctx.imageSmoothingEnabled = false;

  const TILE = 32;
  const MAP_W = 180;
  const MAP_H = 140;
  const WORLD_W = MAP_W * TILE;
  const WORLD_H = MAP_H * TILE;
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (x, y, salt = 0) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };

  const T = { SAND: 0, GRASS: 1, ROAD: 2, STONE: 3, WATER: 4, DIRT: 5, TILE: 6, DECK: 7 };
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.SAND));
  const setTile = (x,y,v) => { if(x>=0&&y>=0&&x<MAP_W&&y<MAP_H) map[y][x]=v; };
  const rectTiles = (x,y,w,h,v) => { for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)setTile(xx,yy,v); };
  function ellipseTiles(cx,cy,rx,ry,v){
    for(let y=Math.floor(cy-ry-1);y<=cy+ry+1;y++)for(let x=Math.floor(cx-rx-1);x<=cx+rx+1;x++){
      const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
      if(d<=1+(rand(x,y,41)-.5)*.16)setTile(x,y,v);
    }
  }
  function roadLine(x1,y1,x2,y2,width=3){
    const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
    for(let i=0;i<=steps;i++){
      const t=steps?i/steps:0,x=Math.round(x1+(x2-x1)*t),y=Math.round(y1+(y2-y1)*t);
      for(let yy=-Math.floor(width/2);yy<=Math.floor(width/2);yy++)for(let xx=-Math.floor(width/2);xx<=Math.floor(width/2);xx++)if(xx*xx+yy*yy<=width*width/2)setTile(x+xx,y+yy,T.ROAD);
    }
  }
  // Oasis regions and little settlements are scattered across a very large desert.
  ellipseTiles(90,70,40,31,T.GRASS);       // Nuraya, main town
  ellipseTiles(35,72,23,19,T.GRASS);       // western fishing village
  ellipseTiles(87,19,22,17,T.GRASS);      // north oasis village
  ellipseTiles(143,80,25,21,T.GRASS);     // eastern date farms
  ellipseTiles(144,25,18,14,T.GRASS);     // eastern garden
  ellipseTiles(43,119,20,14,T.GRASS);     // southern rest stop
  roadLine(90,70,34,72,4); roadLine(90,70,88,20,4); roadLine(90,70,143,80,4);
  roadLine(90,70,144,26,3); roadLine(90,70,44,119,3); roadLine(90,70,88,132,3);
  roadLine(34,72,10,49,2); roadLine(143,80,169,109,2);
  rectTiles(70,54,42,35,T.GRASS); rectTiles(75,64,31,18,T.STONE);
  roadLine(89,42,90,103,3); roadLine(62,72,119,72,3); roadLine(76,58,105,58,2); roadLine(77,91,106,91,2);
  rectTiles(83,62,15,7,T.STONE);
  ellipseTiles(62,54,8,5,T.WATER); ellipseTiles(87,12,6,3,T.WATER); ellipseTiles(32,65,7,4,T.WATER); ellipseTiles(151,75,8,5,T.WATER);
  for(let y=15;y<129;y++){const x=Math.round(124+Math.sin(y*.095)*6+Math.sin(y*.23)*2);setTile(x,y,T.WATER);if(y%4!==0)setTile(x+1,y,T.WATER);}
  rectTiles(118,47,12,3,T.DECK); rectTiles(119,104,12,3,T.DECK); rectTiles(29,70,7,3,T.DECK);
  rectTiles(132,86,24,16,T.DIRT); for(let y=87;y<101;y+=2)rectTiles(133,y,22,1,T.TILE);
  rectTiles(148,56,13,9,T.DIRT); for(let x=149;x<160;x+=2)rectTiles(x,57,1,7,T.TILE);
  rectTiles(29,86,12,7,T.DIRT); ellipseTiles(159,121,14,10,T.STONE); roadLine(143,80,159,121,2);
  const buildings = [
    { id:'mosque',name:'Masjid Al-Qamar',x:83,y:45,w:14,h:13,kind:'mosque',interactX:90*TILE,interactY:58*TILE-7 },
    { id:'library',name:'Rumah Ilmu',x:70,y:76,w:7,h:6,kind:'library',interactX:73.5*TILE,interactY:82*TILE-7 },
    { id:'inn',name:'Penginapan Safa',x:103,y:76,w:8,h:6,kind:'inn',interactX:107*TILE,interactY:82*TILE-7 },
    { id:'house',name:'Rumah keluarga Salim',x:69,y:91,w:7,h:6,kind:'house',interactX:72.5*TILE,interactY:97*TILE-7 },
    { id:'house2',name:'Rumah keluarga Amina',x:104,y:91,w:7,h:6,kind:'house',interactX:107.5*TILE,interactY:97*TILE-7 },
    { id:'northHouse',name:'Rumah penjaga oasis utara',x:81,y:6,w:7,h:6,kind:'house',interactX:84.5*TILE,interactY:12*TILE-7 },
    { id:'harborHouse',name:'Rumah nelayan',x:27,y:78,w:7,h:6,kind:'house',interactX:30.5*TILE,interactY:84*TILE-7 },
    { id:'farmHouse',name:'Rumah kebun kurma',x:139,y:88,w:7,h:6,kind:'house',interactX:142.5*TILE,interactY:94*TILE-7 },
  ];
  const stalls = [
    {x:80,y:62,w:4,h:3,color:'#b95f49',cloth:'#f0c27e'},
    {x:87,y:62,w:4,h:3,color:'#668b72',cloth:'#ead8a9'},
    {x:94,y:62,w:4,h:3,color:'#8872a1',cloth:'#edc48c'},
    {x:101,y:62,w:4,h:3,color:'#b47a48',cloth:'#e9d19c'},
    {x:29,y:67,w:3,h:3,color:'#bd7451',cloth:'#e9c68a'},
  ];
  const trees=[]; const rocks=[]; const cacti=[];
  for(let y=3;y<MAP_H-3;y++)for(let x=3;x<MAP_W-3;x++){
    const v=rand(x,y,8),type=map[y][x];
    if(type===T.GRASS&&v>.985&&rand(x,y,11)>.22)trees.push({x:x*TILE+16,y:y*TILE+18,variant:Math.floor(rand(x,y,4)*4)});
    else if(type===T.SAND&&v>.994)cacti.push([x,y]);
    else if((type===T.SAND||type===T.GRASS)&&v>.989)rocks.push([x,y]);
  }
  [[72,54],[73,87],[108,54],[111,86],[68,70],[115,76],[83,48],[96,48],[79,98],[102,99],[25,57],[44,83],[80,7],[99,27],[137,61],[160,82],[134,92],[153,95],[35,108],[51,125],[170,35],[12,35],[17,91]].forEach(([x,y],i)=>trees.push({x:x*TILE+16,y:y*TILE+18,variant:i%4}));

  const npcs = [
    {id:'merchant',name:'Yusuf',role:'Pedagang pasar',x:91*TILE,y:75*TILE,color:'#c16c4d',accent:'#e6c27e',palette:'merchant',line:'Assalamu’alaikum! Pasar Nuraya selalu ramai. Ada kurma, roti, dan rempah pilihan hari ini.',home:{x:78,y:70,w:29,h:11},speed:34,dir:'down',moving:false,walk:0,wait:2},
    {id:'gardener',name:'Maryam',role:'Pekebun kurma',x:145*TILE,y:83*TILE,color:'#658c67',accent:'#d9b987',palette:'gardener',line:'Pohon kurma perlu dirawat dengan sabar. Sedikit demi sedikit, kebun ini akan berbuah.',home:{x:132,y:81,w:26,h:22},speed:29,dir:'left',moving:false,walk:0,wait:1},
    {id:'traveler',name:'Rafi',role:'Pengembara',x:87*TILE,y:74*TILE,color:'#5683a0',accent:'#d9c69d',palette:'traveler',line:'Aku datang dari pelabuhan barat. Jalan kafilah di sana menghadap matahari terbenam.',home:{x:70,y:64,w:37,h:31},speed:42,dir:'up',moving:false,walk:0,wait:3},
    {id:'guard',name:'Hassan',role:'Penjaga kota',x:89*TILE,y:91*TILE,color:'#a9854f',accent:'#ead7b1',palette:'guard',line:'Selamat datang di Nuraya. Kota ini luas; ikuti jalan kafilah agar tidak tersesat.',home:{x:82,y:55,w:19,h:47},speed:45,dir:'down',moving:false,walk:0,wait:1},
    {id:'scholar',name:'Amina',role:'Penjaga Rumah Ilmu',x:78*TILE,y:82*TILE,color:'#8972a7',accent:'#e8d9b7',palette:'scholar',line:'Di Rumah Ilmu ada kisah tentang bintang, perdagangan, geografi, dan sejarah.',home:{x:66,y:73,w:18,h:17},speed:25,dir:'right',moving:false,walk:0,wait:4},
    {id:'fisher',name:'Bilal',role:'Nelayan pelabuhan',x:34*TILE,y:75*TILE,color:'#9b7752',accent:'#e9d2a0',palette:'fisher',line:'Pagi ini ikan banyak mendekati dermaga. Laut dan sungai memberi rezeki bagi yang tekun.',home:{x:24,y:63,w:22,h:23},speed:31,dir:'down',moving:false,walk:0,wait:2},
    {id:'child',name:'Zahra',role:'Anak warga Nuraya',x:85*TILE,y:87*TILE,color:'#d37b61',accent:'#e8d4b3',palette:'child',line:'Aku suka berlari di alun-alun! Kamu sudah melihat pohon kurma di sebelah timur?',home:{x:77,y:82,w:29,h:18},speed:48,dir:'left',moving:false,walk:0,wait:1},
    {id:'northman',name:'Salim',role:'Penjaga Oasis Utara',x:88*TILE,y:17*TILE,color:'#c16c4d',accent:'#e6c27e',palette:'merchant',line:'Air oasis utara sangat jernih. Para pengembara sering berhenti di sana.',home:{x:76,y:8,w:25,h:21},speed:28,dir:'down',moving:false,walk:0,wait:3},
    {id:'farmer',name:'Hamzah',role:'Petani kurma',x:151*TILE,y:99*TILE,color:'#658c67',accent:'#d9b987',palette:'gardener',line:'Musim panen sebentar lagi. Kebun ini memasok buah untuk pasar kota.',home:{x:132,y:84,w:29,h:22},speed:27,dir:'left',moving:false,walk:0,wait:2},
  ];
  const landmarks = [
    {id:'market',name:'Pasar Rempah Nuraya',x:91*TILE,y:69*TILE,type:'market'},
    {id:'well',name:'Sumur Oasis',x:78*TILE,y:86*TILE,type:'well'},
    {id:'board',name:'Papan Pengumuman Kota',x:99*TILE,y:86*TILE,type:'board'},
    {id:'garden',name:'Kebun Kurma',x:145*TILE,y:84*TILE,type:'garden'},
    {id:'harbor',name:'Dermaga Nelayan',x:32*TILE,y:73*TILE,type:'harbor'},
    {id:'ruins',name:'Reruntuhan Batu',x:159*TILE,y:121*TILE,type:'ruins'},
    {id:'northWell',name:'Kolam Oasis Utara',x:87*TILE,y:15*TILE,type:'well'},
  ];

  const player = { x:90*TILE, y:73*TILE, r:8, speed:148, dir:'down', moving:false, walk:0, palette:'player' };
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
  let scene = 'world';
  let currentBuilding = null;
  let returnPosition = null;
  let actorTime = 0;
  let worldTick = 0;

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
      if (prayer) showToast(`Waktu ${prayer.name} telah tiba. Masjid Al-Qamar berada di pusat Nuraya.`, 4.5);
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
    obstacleRects.push({x:b.x*TILE+5,y:b.y*TILE+30,w:b.w*TILE-10,h:b.h*TILE-39});
    obstacleRects.push({x:b.x*TILE+5,y:(b.y+b.h)*TILE-14,w:b.w*TILE/2-19,h:16});
    obstacleRects.push({x:b.x*TILE+b.w*TILE/2+14,y:(b.y+b.h)*TILE-14,w:b.w*TILE/2-19,h:16});
  });
  stalls.forEach(s=>obstacleRects.push({x:s.x*TILE+5,y:s.y*TILE+22,w:s.w*TILE-10,h:s.h*TILE-22}));
  trees.forEach(t=>obstacleRects.push({x:t.x-11,y:t.y+2,w:22,h:18}));
  rocks.forEach(([x,y])=>obstacleRects.push({x:x*TILE+7,y:y*TILE+8,w:18,h:17}));
  cacti.forEach(([x,y])=>obstacleRects.push({x:x*TILE+9,y:y*TILE+5,w:14,h:23}));
  obstacleRects.push({x:78*TILE-12,y:86*TILE-12,w:24,h:24}); // central well

  function collides(x,y) {
    if(x<12||y<12||x>WORLD_W-12||y>WORLD_H-12)return true;
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
    } else if(type===T.DECK) {
      ctx.fillStyle='#896343';ctx.fillRect(screenX,screenY,TILE,TILE);ctx.fillStyle='#c09361';
      for(let i=0;i<4;i++)ctx.fillRect(screenX+2,screenY+3+i*8,28,3);ctx.fillStyle='#634a35';ctx.fillRect(screenX+4,screenY,2,TILE);ctx.fillRect(screenX+25,screenY,2,TILE);
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
    const x=78*TILE-camera.x+16, y=86*TILE-camera.y+16;
    ctx.fillStyle='rgba(40,40,28,.22)';ctx.fillRect(x-16,y+9,33,7);
    ctx.fillStyle='#a99a78';ctx.fillRect(x-14,y-8,28,17);ctx.fillStyle='#d5c49a';ctx.fillRect(x-11,y-12,22,7);
    ctx.fillStyle='#4f8e98';ctx.fillRect(x-8,y-5,16,9);ctx.fillStyle='#d7c69e';ctx.fillRect(x-17,y-14,34,5);
    ctx.fillStyle='#79583c';ctx.fillRect(x-2,y-28,4,17);ctx.fillRect(x-14,y-28,28,3);ctx.fillStyle='#c69e62';ctx.fillRect(x+9,y-28,3,15);
  }

  function drawGarden() {
    for(let row=0;row<3;row++) for(let col=0;col<4;col++) {
      const x=136+col*3, y=88+row*4;
      const sx=x*TILE-camera.x, sy=y*TILE-camera.y;
      ctx.fillStyle='#715438';ctx.fillRect(sx+4,sy+14,24,7);
      ctx.fillStyle='#467a4c';ctx.fillRect(sx+11,sy+4,10,13);ctx.fillRect(sx+7,sy+8,18,5);
      ctx.fillStyle='#7eae62';ctx.fillRect(sx+13,sy+5,5,3);
      if((row+col)%3===0){ctx.fillStyle='#d1a24d';ctx.fillRect(sx+18,sy+10,4,4);}
    }
  }

  function drawDecoration() {
    rocks.forEach(([x,y])=>{if(x*TILE-camera.x>-25&&x*TILE-camera.x<VIEW_W+25&&y*TILE-camera.y>-25&&y*TILE-camera.y<VIEW_H+25)drawRock(x,y);});
    cacti.forEach(([x,y])=>{if(x*TILE-camera.x>-25&&x*TILE-camera.x<VIEW_W+25&&y*TILE-camera.y>-25&&y*TILE-camera.y<VIEW_H+25)drawCactus(x,y);});
    // Low bushes and flower specks around the visible region only.
    const y0=Math.max(2,Math.floor(camera.y/TILE)-1),y1=Math.min(MAP_H-1,Math.ceil((camera.y+VIEW_H)/TILE)+1);
    const x0=Math.max(2,Math.floor(camera.x/TILE)-1),x1=Math.min(MAP_W-1,Math.ceil((camera.x+VIEW_W)/TILE)+1);
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) {
      if(rand(x,y,8)>.986 && map[y][x]===T.GRASS && !(x>18&&x<28&&y>10&&y<22)) {
        const sx=x*TILE-camera.x+12, sy=y*TILE-camera.y+18;
        ctx.fillStyle='#4f8154';ctx.fillRect(sx-4,sy-2,8,5);ctx.fillStyle='#91a96a';ctx.fillRect(sx-2,sy-4,4,3);
      }
      if(rand(x,y,9)>.994 && map[y][x]===T.GRASS) {
        const sx=x*TILE-camera.x+18, sy=y*TILE-camera.y+17;ctx.fillStyle='#e4c27d';ctx.fillRect(sx,sy,2,2);
      }
    }
  }

  const spritePalettes={
    player:{robe:'#2f8378',shade:'#205d58',light:'#6db3a0',wrap:'#e6d4ad',wrapShade:'#bda77c',skin:'#b97856',hair:'#49352c',boots:'#624536',gold:'#d9b66d'},
    merchant:{robe:'#c16c4d',shade:'#844637',light:'#e6a06b',wrap:'#e6c27e',wrapShade:'#b28c52',skin:'#a9684b',hair:'#48352b',boots:'#674638',gold:'#e8d09a'},
    gardener:{robe:'#658c67',shade:'#3f654e',light:'#9dbb7c',wrap:'#d9b987',wrapShade:'#a78b62',skin:'#b9795b',hair:'#40312c',boots:'#644838',gold:'#dfc77f'},
    traveler:{robe:'#5683a0',shade:'#365b78',light:'#8fb4c4',wrap:'#d9c69d',wrapShade:'#a99470',skin:'#bd8060',hair:'#49342a',boots:'#654838',gold:'#e2bf7e'},
    guard:{robe:'#a9854f',shade:'#6c5537',light:'#d2b476',wrap:'#ead7b1',wrapShade:'#baa37a',skin:'#a96b4e',hair:'#41332a',boots:'#624633',gold:'#d9b46c'},
    scholar:{robe:'#8972a7',shade:'#5d4e78',light:'#b5a0cb',wrap:'#e8d9b7',wrapShade:'#bba77e',skin:'#bd8264',hair:'#44342f',boots:'#654a3b',gold:'#dfc783'},
    fisher:{robe:'#9b7752',shade:'#6c5039',light:'#c39b6c',wrap:'#e9d2a0',wrapShade:'#b39c70',skin:'#a9684b',hair:'#49362d',boots:'#654838',gold:'#8cb3b0'},
    child:{robe:'#d37b61',shade:'#954f4c',light:'#f0ad84',wrap:'#e8d4b3',wrapShade:'#bba27d',skin:'#c48765',hair:'#4b342b',boots:'#624638',gold:'#f0cf83'}
  };
  const spriteCache=new Map();
  // Original chibi sprite atlas: 8 character looks × 4 directions × 4 walk frames.
  const chibiAtlas = new Image();
  chibiAtlas.src = 'assets/chibi-sprites.png';
  const chibiPaletteRows = { player:0, merchant:1, gardener:2, traveler:3, guard:4, scholar:5, fisher:6, child:7 };
  const chibiDirectionRows = { down:0, left:1, right:2, up:3 };
  function makeSprite(paletteName,dir,frame){
    const key=`${paletteName}:${dir}:${frame}`;if(spriteCache.has(key))return spriteCache.get(key);
    const p=spritePalettes[paletteName]||spritePalettes.player;
    const c=document.createElement('canvas');c.width=24;c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const px=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
    const step=frame===1?-2:frame===3?2:frame===2?1:0,arm=frame===1?2:frame===3?-2:0;
    // Boots, trousers and robe silhouette.
    px(7,25,4,4,p.shade);px(13,25,4,4,p.shade);if(frame===1){px(6,27,5,3,p.shade);px(14,24,4,4,p.shade);}if(frame===3){px(7,24,4,4,p.shade);px(14,27,5,3,p.shade);}
    px(6+step,28,5,3,p.boots);px(14-step,28,5,3,p.boots);px(7+step,28,2,1,p.gold);px(15-step,28,2,1,p.gold);
    px(6,15,12,11,p.shade);px(5,18,14,8,p.robe);px(7,14,10,11,p.robe);px(8,15,2,9,p.light);px(14,16,2,8,p.shade);
    px(10,16,2,10,p.gold);px(10,17,1,8,'#f0dcae');px(5,24,14,2,p.shade);
    px(3,17+Math.max(0,arm),4,7,p.shade);px(17,17+Math.max(0,-arm),4,7,p.shade);px(4,18+Math.max(0,arm),2,5,p.robe);px(18,18+Math.max(0,-arm),2,5,p.robe);
    px(4,23+Math.max(0,arm),3,2,p.skin);px(17,23+Math.max(0,-arm),3,2,p.skin);
    // Head is larger than the body for a friendly, original chibi RPG look.
    px(9,12,6,4,p.skin);px(6,4,12,11,p.skin);px(7,3,10,2,p.skin);px(6,7,2,5,p.skin);px(16,7,2,5,p.skin);
    px(5,3,14,7,p.wrapShade);px(7,1,10,5,p.wrap);px(8,0,8,3,p.wrap);px(5,5,3,5,p.wrap);px(16,5,3,5,p.wrapShade);px(8,3,8,2,p.wrapShade);px(10,0,4,2,p.gold);
    if(dir==='down'){px(8,9,2,2,p.hair);px(14,9,2,2,p.hair);px(9,12,6,1,'#8e5040');px(10,13,4,1,'#f0c09a');}
    else if(dir==='left'){px(7,9,2,2,p.hair);px(6,11,2,2,p.skin);px(8,13,3,1,'#8e5040');px(5,7,2,5,p.wrapShade);}
    else if(dir==='right'){px(15,9,2,2,p.hair);px(16,11,2,2,p.skin);px(13,13,3,1,'#8e5040');px(17,7,2,5,p.wrapShade);}
    else{px(7,8,10,5,p.wrapShade);px(8,10,8,3,p.wrap);px(7,13,10,2,p.shade);}
    if(paletteName==='player'){px(dir==='left'?17:18,18,4,6,'#9a623e');px(19,19,2,2,p.gold);}
    spriteCache.set(key,c);return c;
  }
  function drawActor(actor,isPlayer=false){
    const sx=Math.round(actor.x-camera.x),sy=Math.round(actor.y-camera.y);
    const frame=actor.moving?Math.floor(actor.walk/2.1)%4:0;
    const bob=actor.moving?Math.round(Math.abs(Math.sin(actor.walk))*1.2):0;
    ctx.fillStyle='rgba(38,29,22,.30)';
    ctx.beginPath();ctx.ellipse(sx,sy-1,13,5,0,0,Math.PI*2);ctx.fill();
    const paletteRow=chibiPaletteRows[actor.palette||'player']??0;
    const directionRow=chibiDirectionRows[actor.dir]??0;
    if(chibiAtlas.complete&&chibiAtlas.naturalWidth>0){
      // 32×40 pixel sprites are scaled with smoothing disabled for crisp chunky pixels.
      ctx.drawImage(chibiAtlas,frame*32,(paletteRow*4+directionRow)*40,32,40,sx-29,sy-69-bob,58,72);
    }else{
      // Brief fallback while the sprite atlas loads.
      ctx.drawImage(makeSprite(actor.palette||'player',actor.dir,frame),sx-25,sy-62-bob,50,64);
    }
    if(!isPlayer&&Math.hypot(player.x-actor.x,player.y-actor.y)<86){
      ctx.font='bold 11px Manrope,sans-serif';ctx.textAlign='center';
      const label=actor.name,w=ctx.measureText(label).width+14;
      ctx.fillStyle='rgba(34,43,34,.88)';ctx.fillRect(sx-w/2,sy-81-bob,w,17);
      ctx.strokeStyle='rgba(240,211,151,.65)';ctx.strokeRect(sx-w/2,sy-81-bob,w,17);
      ctx.fillStyle='#fff0cf';ctx.fillText(label,sx,sy-69-bob);
    }
  }
  function drawNPC(n,time){drawActor(n,false);}
  function drawPlayer(time){drawActor(player,true);}

  function drawWorld(time) {
    if(scene==='interior'){drawInterior(time);return;}
    ctx.clearRect(0,0,VIEW_W,VIEW_H);
    const startX=clamp(Math.floor(camera.x/TILE),0,MAP_W-1), startY=clamp(Math.floor(camera.y/TILE),0,MAP_H-1);
    const endX=clamp(Math.ceil((camera.x+VIEW_W)/TILE)+1,0,MAP_W), endY=clamp(Math.ceil((camera.y+VIEW_H)/TILE)+1,0,MAP_H);
    for(let y=startY;y<endY;y++) for(let x=startX;x<endX;x++) drawGroundTile(x,y,Math.floor(x*TILE-camera.x),Math.floor(y*TILE-camera.y));
    drawDecoration();
    const layers=[];
    trees.forEach(t=>{if(t.x-camera.x>-45&&t.x-camera.x<VIEW_W+45&&t.y-camera.y>-55&&t.y-camera.y<VIEW_H+45)layers.push({y:t.y,draw:()=>drawPalm(t.x,t.y,t.variant)});});
    buildings.forEach(b=>layers.push({y:(b.y+b.h)*TILE-8,draw:()=>{if(b.kind==='mosque')drawMosque(b);else if(b.kind==='house')drawHouse(b);else if(b.kind==='library')drawLibrary(b);else drawInn(b);}}));
    stalls.forEach(st=>layers.push({y:(st.y+st.h)*TILE,draw:()=>drawStall(st,0)}));
    layers.push({y:86*TILE,draw:drawWell},{y:103*TILE,draw:drawGarden});
    landmarks.forEach(l=>{if(l.type==='board')layers.push({y:l.y,draw:()=>{const bx=l.x-camera.x,by=l.y-camera.y;ctx.fillStyle='#684a33';ctx.fillRect(bx-3,by-3,6,23);ctx.fillStyle='#bd9257';ctx.fillRect(bx-14,by-13,28,14);ctx.fillStyle='#73563a';ctx.fillRect(bx-9,by-8,18,2);ctx.fillRect(bx-9,by-3,13,2);}});});
    npcs.forEach(n=>layers.push({y:n.y,draw:()=>drawNPC(n,time)}));layers.push({y:player.y,draw:()=>drawPlayer(time)});
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
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
    const colors={ [T.SAND]:'#c9a66b',[T.GRASS]:'#6e965e',[T.ROAD]:'#b88f5a',[T.STONE]:'#c6b58a',[T.WATER]:'#4d91a0',[T.DIRT]:'#997246',[T.TILE]:'#7b6040',[T.DECK]:'#825d40' };
    for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++){mctx.fillStyle=colors[map[y][x]];mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));}
    // Building markers.
    buildings.forEach(b=>{mctx.fillStyle=b.kind==='mosque'?'#f5edcf':'#ac7151';mctx.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);});
    mctx.fillStyle='#fff2c8';mctx.fillRect((player.x/WORLD_W)*mini.width-2,(player.y/WORLD_H)*mini.height-2,4,4);
    mctx.strokeStyle='rgba(255,255,255,.7)';mctx.lineWidth=1;mctx.strokeRect(0,0,mini.width,mini.height);
  }

  function getNearestTarget() {
    if(scene==='interior'){
      const d=Math.hypot(player.x-VIEW_W/2,player.y-(VIEW_H-100));
      return d<66?{type:'exit',name:'Pintu keluar'}:null;
    }
    let best=null,bestD=Infinity;
    for(const b of buildings){const d=Math.hypot(player.x-b.interactX,player.y-b.interactY);if(d<63&&d<bestD){best={type:'door',name:b.name,building:b};bestD=d;}}
    for(const n of npcs){const d=Math.hypot(player.x-n.x,player.y-n.y);if(d<49&&d<bestD){best={type:'npc',name:n.name,npc:n};bestD=d;}}
    for(const t of landmarks){const d=Math.hypot(player.x-t.x,player.y-t.y);if(d<52&&d<bestD){best=t;bestD=d;}}
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

  function enterBuilding(b){
    returnPosition={x:player.x,y:player.y,location:currentLocation};currentBuilding=b;scene='interior';
    player.x=VIEW_W/2;player.y=VIEW_H-180;player.dir='down';player.moving=false;currentLocation=b.name;updateHud();
    showToast(`Memasuki ${b.name}. Tekan E di dekat pintu untuk keluar.`);
  }
  function exitBuilding(){
    scene='world';player.x=returnPosition?.x??player.x;player.y=(returnPosition?.y??player.y)+30;
    player.dir='up';currentBuilding=null;currentLocation=returnPosition?.location||'Kota Nuraya';returnPosition=null;updateHud();
    showToast('Kamu kembali ke jalanan Nuraya.');
  }
  function drawInterior(time){
    ctx.clearRect(0,0,VIEW_W,VIEW_H);ctx.fillStyle='#604b36';ctx.fillRect(0,0,VIEW_W,VIEW_H);
    const kind=currentBuilding?.kind||'house';
    for(let y=0;y<VIEW_H;y+=32)for(let x=0;x<VIEW_W;x+=32){ctx.fillStyle=((x/32+y/32)%2===0)?'#cbb991':'#c2ad83';ctx.fillRect(x,y,32,32);ctx.fillStyle='rgba(92,63,39,.13)';ctx.fillRect(x+1,y+1,30,1);}
    ctx.fillStyle='#eadbbd';ctx.fillRect(0,0,VIEW_W,38);ctx.fillRect(0,0,22,VIEW_H);ctx.fillRect(VIEW_W-22,0,22,VIEW_H);
    ctx.fillStyle='#9c744b';ctx.fillRect(0,35,VIEW_W,7);ctx.fillRect(18,40,6,VIEW_H-40);ctx.fillRect(VIEW_W-25,40,6,VIEW_H-40);
    if(kind==='mosque'){
      ctx.fillStyle='#477f72';ctx.fillRect(250,100,460,340);ctx.fillStyle='#d8c493';ctx.fillRect(264,114,432,312);
      for(let y=140;y<380;y+=58)for(let x=300;x<670;x+=78){ctx.fillStyle='#8d5347';ctx.fillRect(x,y,49,39);ctx.fillStyle='#d7b778';ctx.fillRect(x+4,y+4,41,31);ctx.fillStyle='#46776e';ctx.fillRect(x+9,y+9,31,21);ctx.fillStyle='#e6d2a5';ctx.fillRect(x+21,y+12,7,13);}
    }else if(kind==='library'){
      for(let x=70;x<900;x+=190){ctx.fillStyle='#624735';ctx.fillRect(x,85,128,20);ctx.fillRect(x,105,9,270);ctx.fillRect(x+119,105,9,270);for(let y=130;y<360;y+=57){ctx.fillStyle='#a77a4f';ctx.fillRect(x+8,y,112,8);for(let i=0;i<8;i++){ctx.fillStyle=['#a85c4b','#547f75','#c39c5e','#7d6995'][i%4];ctx.fillRect(x+13+i*13,y-21,9,21);}}}
    }else{
      ctx.fillStyle='#79563c';ctx.fillRect(90,90,190,120);ctx.fillRect(680,90,190,120);ctx.fillStyle='#d8c69f';ctx.fillRect(104,104,162,92);ctx.fillRect(694,104,162,92);
      ctx.fillStyle='#6a806c';ctx.fillRect(350,100,260,75);ctx.fillStyle='#dfcda8';ctx.fillRect(364,112,232,50);ctx.fillStyle='#8c6748';ctx.fillRect(350,385,260,65);
    }
    // Front doorway and threshold.
    ctx.fillStyle='#62452f';ctx.fillRect(VIEW_W/2-42,VIEW_H-75,84,75);ctx.fillStyle='#3f332b';ctx.fillRect(VIEW_W/2-32,VIEW_H-70,64,70);ctx.fillStyle='#d7b66f';ctx.fillRect(VIEW_W/2-49,VIEW_H-8,98,8);
    if(Math.hypot(player.x-VIEW_W/2,player.y-(VIEW_H-100))<66){ctx.fillStyle='#fff0c4';ctx.font='bold 13px Manrope,sans-serif';ctx.textAlign='center';ctx.fillText('E  KELUAR',VIEW_W/2,VIEW_H-91);}
    drawPlayer(time);
    ctx.fillStyle='rgba(24,39,31,.8)';ctx.fillRect(15,14,280,31);ctx.fillStyle='#f4e4c2';ctx.font='bold 12px Manrope,sans-serif';ctx.textAlign='left';ctx.fillText(currentBuilding.name,27,35);
  }

  function interact(target) {
    if(!target)return;
    if(target.type==='door'){enterBuilding(target.building);return;}
    if(target.type==='exit'){exitBuilding();return;}
    switch(target.type){
      case 'npc': {
        const n=target.npc;
        n.dir=Math.abs(player.x-n.x)>Math.abs(player.y-n.y)?(player.x<n.x?'left':'right'):(player.y<n.y?'up':'down');
        n.moving=false;n.wait=Math.max(n.wait,2.2);
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
    const data={x:scene==='world'?player.x:(returnPosition?.x??player.x),y:scene==='world'?player.y:(returnPosition?.y??player.y),coins,inventory,gameMinutes,day,deliveredQuest};
    try{localStorage.setItem('jejakNurSaveV2',JSON.stringify(data));showToast('Progres tersimpan di browser ini.');}
    catch(e){showToast('Penyimpanan tidak tersedia di browser ini.');}
  }
  function loadGame() {
    try {
      const raw=localStorage.getItem('jejakNurSaveV2')||localStorage.getItem('jejakNurSaveV1');if(!raw)return;
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
    if(scene==='interior'){currentLocation=currentBuilding?.name||'Dalam bangunan';ui.location.textContent=currentLocation;return;}
    const x=player.x/TILE,y=player.y/TILE;let loc='Hamparan Gurun';
    if(x>68&&x<114&&y>43&&y<104)loc='Kota Nuraya';
    else if(x>67&&x<108&&y<33)loc='Oasis Utara';
    else if(x<54&&y>53&&y<96)loc='Pelabuhan Barat';
    else if(x>126&&y>52&&y<108)loc='Kebun Kurma Timur';
    else if(x>145&&y>108)loc='Reruntuhan Selatan';
    else if(x<62&&y>105)loc='Lembah Selatan';
    else if(x>130&&y<42)loc='Taman Oasis Timur';
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

  function chooseNpcDestination(n){
    const h=n.home;
    for(let i=0;i<12;i++){
      const x=(h.x+2+rand(Math.floor(n.x/TILE)+i,Math.floor(n.y/TILE),n.id.length)*Math.max(1,h.w-4))*TILE+16;
      const y=(h.y+2+rand(Math.floor(n.y/TILE),Math.floor(n.x/TILE)+i,n.id.length+8)*Math.max(1,h.h-4))*TILE+16;
      if(!collides(x,y)){n.tx=x;n.ty=y;n.wait=.5+rand(x,y,3)*1.8;return;}
    }
    n.tx=n.x;n.ty=n.y;n.wait=1.4;
  }
  function updateNPCs(dt){
    if(scene!=='world'||modalOpen)return;actorTime+=dt;
    for(const n of npcs){
      if(n.wait>0){n.wait-=dt;n.moving=false;continue;}
      if(!Number.isFinite(n.tx)||!Number.isFinite(n.ty)||Math.hypot(n.tx-n.x,n.ty-n.y)<8){chooseNpcDestination(n);continue;}
      const dx=n.tx-n.x,dy=n.ty-n.y,len=Math.hypot(dx,dy),vx=dx/Math.max(1,len)*n.speed*dt,vy=dy/Math.max(1,len)*n.speed*dt;
      n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
      const oldX=n.x,oldY=n.y;
      if(!collides(n.x+vx,n.y))n.x+=vx;if(!collides(n.x,n.y+vy))n.y+=vy;
      n.moving=Math.hypot(n.x-oldX,n.y-oldY)>.1;if(n.moving)n.walk+=dt*9;else n.wait=.6+rand(n.x,n.y,6)*1.5;
    }
  }

  function update(dt) {
    if(!modalOpen){
      const {dx,dy}=setDirectionFromKeys();player.moving=!!(dx||dy);
      if(player.moving){
        if(scene==='world')movePlayer(dx*player.speed*dt,dy*player.speed*dt);
        else{player.x=clamp(player.x+dx*player.speed*dt,40,VIEW_W-40);player.y=clamp(player.y+dy*player.speed*dt,65,VIEW_H-35);}
        player.walk+=dt*11;
      }
      updateNPCs(dt);changeClock(dt*2.1);
    }else player.moving=false;
    if(scene==='world'){camera.x=clamp(player.x-VIEW_W/2,0,WORLD_W-VIEW_W);camera.y=clamp(player.y-VIEW_H/2,0,WORLD_H-VIEW_H);}else{camera.x=0;camera.y=0;}
    activeTarget=modalOpen?null:getNearestTarget();ui.hint.classList.toggle('visible',!!activeTarget&&!modalOpen);
    if(activeTarget)ui.hint.innerHTML=`Tekan <kbd>E</kbd> untuk ${activeTarget.type==='door'?'masuk':activeTarget.type==='exit'?'keluar':activeTarget.type==='npc'?'berbicara':'interaksi'}`;
    updateLocation();
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show');}
  }

  function frame(timestamp) {
    const dt=Math.min(.04,(timestamp-lastFrame)/1000||0);lastFrame=timestamp;
    update(dt);drawWorld(timestamp);if(worldTick>.15){drawMinimap();worldTick=0;}worldTick+=dt;requestAnimationFrame(frame);
  }

  function doInteract(){if(modalOpen)return;if(activeTarget)interact(activeTarget);else showToast('Belum ada orang atau tempat di dekatmu.');}
  function showHelp(){
    openModal('Cara bermain','<p><b>Bergerak:</b> gunakan tombol WASD atau tombol panah.</p><p><b>Interaksi:</b> dekati penduduk atau tempat yang ditandai, lalu tekan E. Tekan E di dekat pintu untuk masuk atau keluar. Di ponsel, gunakan tombol arah dan tombol INTERAKSI.</p><p><b>Jelajah:</b> dunia memiliki ukuran 180 × 140 tile, berisi beberapa oasis, desa, kebun kurma, pelabuhan, dan reruntuhan. Peta mini menunjukkan seluruh wilayah.</p><p><b>Bangunan:</b> dekati pintu depan lalu tekan E untuk masuk. Di dalam, berjalan ke pintu bawah dan tekan E untuk keluar.</p><p><b>Penduduk:</b> warga berjalan di sekitar wilayah tempat tinggalnya. Dekati mereka untuk berbicara; mereka akan berhenti dan menghadapmu.</p><p><b>Waktu:</b> waktu berjalan lebih cepat dari waktu nyata. Pengingat salat menggunakan jadwal simulasi di dalam game.</p><p><b>Simpan:</b> tekan ikon kotak di kanan atas untuk menyimpan progres pada browser ini.</p>',[{label:'Mulai menjelajah',run:closeModal}],'PANDUAN');
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
