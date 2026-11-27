(() => {
  'use strict';

  // JEJAK NUR — playable browser prototype, version 0.5
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
  const ZOOM = 0.8;
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
  rectTiles(70,54,42,35,T.GRASS);
  // A smaller patterned plaza leaves room for gardens and side lanes.
  rectTiles(78,65,22,10,T.STONE); rectTiles(86,61,6,5,T.STONE);
  roadLine(89,42,90,103,3); roadLine(62,72,119,72,3); roadLine(76,58,105,58,2); roadLine(77,91,106,91,2);
  rectTiles(83,62,15,7,T.STONE);
  ellipseTiles(62,54,8,5,T.WATER); ellipseTiles(87,12,6,3,T.WATER); ellipseTiles(32,65,7,4,T.WATER); ellipseTiles(151,75,8,5,T.WATER);
  for(let y=15;y<129;y++){const x=Math.round(124+Math.sin(y*.095)*6+Math.sin(y*.23)*2);setTile(x,y,T.WATER);if(y%4!==0)setTile(x+1,y,T.WATER);}
  rectTiles(118,47,12,3,T.DECK); rectTiles(119,104,12,3,T.DECK); rectTiles(29,70,7,3,T.DECK);
  // Main east bridge: the road to the date farm must cross the river on a walkable deck.
  rectTiles(116,75,18,6,T.DECK);
  // A short boardwalk crosses the southern edge of the eastern oasis pond, continuing the garden road.
  rectTiles(140,79,15,3,T.DECK);
  rectTiles(132,86,24,16,T.DIRT); for(let y=87;y<101;y+=2)rectTiles(133,y,22,1,T.TILE);
  rectTiles(148,56,13,9,T.DIRT); for(let x=149;x<160;x+=2)rectTiles(x,57,1,7,T.TILE);
  rectTiles(29,86,12,7,T.DIRT); ellipseTiles(159,121,14,10,T.STONE); roadLine(143,80,159,121,2);
  const buildings = [
    { id:'mosque',name:'Masjid Al-Qamar',x:74,y:61,w:12,h:13,kind:'mosque',interactX:80*TILE,interactY:74*TILE-7 },
    { id:'library',name:'Rumah Ilmu',x:70,y:76,w:7,h:6,kind:'library',interactX:73.5*TILE,interactY:82*TILE-7 },
    { id:'inn',name:'Penginapan Safa',x:103,y:76,w:8,h:6,kind:'inn',interactX:107*TILE,interactY:82*TILE-7 },
    { id:'house',name:'Rumah keluarga Salim',x:69,y:91,w:7,h:6,kind:'house',interactX:72.5*TILE,interactY:97*TILE-7 },
    { id:'house2',name:'Rumah keluarga Amina',x:104,y:91,w:7,h:6,kind:'house',interactX:107.5*TILE,interactY:97*TILE-7 },
    { id:'northHouse',name:'Rumah penjaga oasis utara',x:81,y:6,w:7,h:6,kind:'house',interactX:84.5*TILE,interactY:12*TILE-7 },
    { id:'harborHouse',name:'Rumah nelayan',x:27,y:78,w:7,h:6,kind:'house',interactX:30.5*TILE,interactY:84*TILE-7 },
    { id:'farmHouse',name:'Rumah kebun kurma',x:139,y:88,w:7,h:6,kind:'house',interactX:142.5*TILE,interactY:94*TILE-7 },
  ];
  const stalls = [
    {x:88,y:66,w:4,h:3,color:'#b95f49',cloth:'#f0c27e'},
    {x:93,y:66,w:4,h:3,color:'#668b72',cloth:'#ead8a9'},
    {x:98,y:66,w:4,h:3,color:'#8872a1',cloth:'#edc48c'},
    {x:103,y:66,w:4,h:3,color:'#b47a48',cloth:'#e9d19c'},
    {x:29,y:67,w:3,h:3,color:'#bd7451',cloth:'#e9c68a'},
  ];
  const trees=[]; const rocks=[]; const cacti=[];
  for(let y=3;y<MAP_H-3;y++)for(let x=3;x<MAP_W-3;x++){
    const v=rand(x,y,8),type=map[y][x];
    if(type===T.GRASS&&v>.985&&rand(x,y,11)>.22)trees.push({x:x*TILE+16,y:y*TILE+18,variant:Math.floor(rand(x,y,4)*6)});
    else if(type===T.SAND&&v>.994)cacti.push([x,y]);
    else if((type===T.SAND||type===T.GRASS)&&v>.989)rocks.push([x,y]);
  }
  [[72,54],[73,87],[108,54],[111,86],[68,70],[115,76],[83,48],[96,48],[79,98],[102,99],[25,57],[44,83],[80,7],[99,27],[137,61],[160,82],[134,92],[153,95],[35,108],[51,125],[170,35],[12,35],[17,91],
   [71,62],[101,61],[107,63],[70,84],[76,88],[101,87],[109,83],[79,91],[98,91],[68,76],[111,76],[100,55],[113,64],[67,65],[108,71],[81,56],[110,57],[80,86],[113,87],[64,88],[117,91],[143,88],[155,91]].forEach(([x,y],i)=>trees.push({x:x*TILE+16,y:y*TILE+18,variant:i%6}));
  // Keep the main walking corridors clear so trees/rocks never seal the route to a quest area.
  function pointSegmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,t=clamp(((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));}
  const walkCorridors=[[90,70,143,80,5.8],[90,70,34,72,3.5],[90,70,88,20,3.5],[90,70,44,119,3.5],[143,80,159,121,3.5]];
  const inCorridor=(x,y)=>walkCorridors.some(([x1,y1,x2,y2,r])=>pointSegmentDistance(x,y,x1,y1,x2,y2)<r);
  for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(inCorridor(t.x/TILE,t.y/TILE))trees.splice(i,1);}
  for(let i=rocks.length-1;i>=0;i--){const [x,y]=rocks[i];if(inCorridor(x,y))rocks.splice(i,1);}

  const npcs = [
    {id:'merchant',name:'Yusuf',role:'Pedagang pasar',x:91*TILE,y:72*TILE,color:'#c16c4d',accent:'#e6c27e',palette:'merchant',line:'Assalamu’alaikum! Pasar Nuraya selalu ramai. Ada kurma, roti, dan rempah pilihan hari ini.',home:{x:78,y:70,w:29,h:11},speed:34,dir:'down',moving:false,walk:0,wait:2},
    {id:'gardener',name:'Maryam',role:'Pekebun kurma',x:145*TILE,y:83*TILE,color:'#658c67',accent:'#d9b987',palette:'gardener',line:'Pohon kurma perlu dirawat dengan sabar. Sedikit demi sedikit, kebun ini akan berbuah.',home:{x:142,y:81,w:6,h:6},speed:22,dir:'left',moving:false,walk:0,wait:1},
    {id:'traveler',name:'Rafi',role:'Pengembara',x:99*TILE,y:81*TILE,color:'#5683a0',accent:'#d9c69d',palette:'traveler',line:'Aku datang dari pelabuhan barat. Jalan kafilah di sana menghadap matahari terbenam.',home:{x:94,y:76,w:14,h:12},speed:42,dir:'up',moving:false,walk:0,wait:3},
    {id:'guard',name:'Hassan',role:'Penjaga kota',x:89*TILE,y:91*TILE,color:'#a9854f',accent:'#ead7b1',palette:'guard',line:'Selamat datang di Nuraya. Kota ini luas; ikuti jalan kafilah agar tidak tersesat.',home:{x:82,y:55,w:19,h:47},speed:45,dir:'down',moving:false,walk:0,wait:1},
    {id:'scholar',name:'Amina',role:'Penjaga Rumah Ilmu',x:78*TILE,y:82*TILE,color:'#8972a7',accent:'#e8d9b7',palette:'scholar',line:'Di Rumah Ilmu ada kisah tentang bintang, perdagangan, geografi, dan sejarah.',home:{x:66,y:73,w:18,h:17},speed:25,dir:'right',moving:false,walk:0,wait:4},
    {id:'fisher',name:'Bilal',role:'Nelayan pelabuhan',x:34*TILE,y:75*TILE,color:'#9b7752',accent:'#e9d2a0',palette:'fisher',line:'Pagi ini ikan banyak mendekati dermaga. Laut dan sungai memberi rezeki bagi yang tekun.',home:{x:24,y:63,w:22,h:23},speed:31,dir:'down',moving:false,walk:0,wait:2},
    {id:'child',name:'Zahra',role:'Anak warga Nuraya',x:85*TILE,y:87*TILE,color:'#d37b61',accent:'#e8d4b3',palette:'child',line:'Aku suka berlari di alun-alun! Kamu sudah melihat pohon kurma di sebelah timur?',home:{x:77,y:82,w:29,h:18},speed:48,dir:'left',moving:false,walk:0,wait:1},
    {id:'northman',name:'Salim',role:'Penjaga Oasis Utara',x:88*TILE,y:17*TILE,color:'#c16c4d',accent:'#e6c27e',palette:'merchant',line:'Air oasis utara sangat jernih. Para pengembara sering berhenti di sana.',home:{x:76,y:8,w:25,h:21},speed:28,dir:'down',moving:false,walk:0,wait:3},
    {id:'farmer',name:'Hamzah',role:'Petani kurma',x:151*TILE,y:99*TILE,color:'#658c67',accent:'#d9b987',palette:'farmer',line:'Musim panen sebentar lagi. Kebun ini memasok buah untuk pasar kota.',home:{x:132,y:84,w:29,h:22},speed:27,dir:'left',moving:false,walk:0,wait:2},
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

  const player = { x:89*TILE, y:72*TILE, r:7, speed:142, dir:'down', moving:false, walk:0, palette:'player' };
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
  // Quest stages: 0 = meet Yusuf, 1 = buy dates, 2 = deliver to Maryam, 3 = complete.
  let questStage = 0;
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
    questTitle:document.getElementById('questTitle'), questText:document.getElementById('questText'), questStep:document.getElementById('questStep'),
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
    updateQuestHud();
  }

  function updateQuestHud() {
    if (!ui.questTitle) return;
    const states = [
      ['Bantuan untuk kebun kurma', 'Temui Yusuf, pedagang di Pasar Nuraya.', '1 / 3 · Temui Yusuf'],
      ['Bantuan untuk kebun kurma', 'Beli 1 paket kurma di kios Pasar Rempah Nuraya.', '2 / 3 · Beli kurma'],
      ['Bantuan untuk kebun kurma', 'Ikuti jalan ke timur, seberangi jembatan kayu, lalu temui Maryam di kebun kurma.', '3 / 3 · Temui Maryam'],
      ['Misi selesai!', 'Kamu sudah membantu Yusuf dan Maryam. Terima kasih!', '✓ Selesai · Hadiah diterima']
    ];
    const state = states[questStage] || states[0];
    ui.questTitle.textContent = state[0];
    ui.questText.textContent = state[1];
    ui.questStep.textContent = state[2];
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
  // Solid walls stop movement, while the centered arch is genuinely walkable.
  buildings.forEach(b => {
    const x=b.x*TILE, y=b.y*TILE, w=b.w*TILE, h=b.h*TILE;
    const doorW=b.kind==='mosque'?54:42;
    const frontTop=y+h-60;
    const frontBottom=y+h-10;
    obstacleRects.push({x:x+5,y:y+29,w:w-10,h:Math.max(8,frontTop-(y+29))});
    const sideW=(w-doorW)/2-4;
    obstacleRects.push({x:x+5,y:frontTop,w:sideW,h:frontBottom-frontTop});
    obstacleRects.push({x:x+w-sideW-5,y:frontTop,w:sideW,h:frontBottom-frontTop});
    b.doorX=x+w/2; b.doorY=y+h+10;
  });
  stalls.forEach(s=>obstacleRects.push({x:s.x*TILE+4,y:s.y*TILE+23,w:s.w*TILE-8,h:s.h*TILE-23}));
  trees.forEach(t=>obstacleRects.push({x:t.x-8,y:t.y+1,w:16,h:14}));
  rocks.forEach(([x,y])=>obstacleRects.push({x:x*TILE+7,y:y*TILE+8,w:18,h:17}));
  cacti.forEach(([x,y])=>obstacleRects.push({x:x*TILE+9,y:y*TILE+5,w:14,h:23}));
  obstacleRects.push({x:78*TILE-12,y:86*TILE-12,w:24,h:24}); // central well
  // Small garden beds and fixed props have physical edges too.
  for(let row=0;row<3;row++) for(let col=0;col<4;col++) {
    const gx=136+col*3, gy=88+row*4;
    obstacleRects.push({x:gx*TILE+8,y:gy*TILE+6,w:16,h:14});
  }

  function collides(x,y,r=player.r,actor=null) {
    if(x-r<8||y-r<8||x+r>WORLD_W-8||y+r>WORLD_H-8)return true;
    const samples=[[x,y]];
    for(let i=0;i<8;i++){const a=i*Math.PI/4;samples.push([x+Math.cos(a)*r*.92,y+Math.sin(a)*r*.92]);}
    if(samples.some(([sx,sy])=>tileAtWorld(sx,sy)===T.WATER))return true;
    if(obstacleRects.some(rect=>circleRectCollision(x,y,r,rect)))return true;
    // Actors have their own small collision circles; no walking through neighbors.
    const others=[player,...npcs];
    for(const other of others){if(other===actor)continue;const rr=other===player?(other.r||7):8;if(Math.hypot(x-other.x,y-other.y)<r+rr-1)return true;}
    return false;
  }
  function movePlayer(dx,dy) {
    // Short sub-steps stop fast movement from tunnelling through walls.
    const distance=Math.hypot(dx,dy), steps=Math.max(1,Math.ceil(distance/5));
    const sx=dx/steps, sy=dy/steps;
    for(let i=0;i<steps;i++){
      if(!collides(player.x+sx,player.y,player.r,player))player.x+=sx;
      if(!collides(player.x,player.y+sy,player.r,player))player.y+=sy;
    }
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
      if((x%4===0)&&(y%4===0)){ctx.fillStyle='rgba(65,119,104,.34)';ctx.fillRect(screenX+14,screenY+10,4,4);ctx.fillRect(screenX+12,screenY+12,8,2);ctx.fillStyle='rgba(218,181,111,.42)';ctx.fillRect(screenX+15,screenY+11,2,2);}
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
    if(variant>=4){
      const crown=variant===4?['#3d754d','#5e945d','#91b66e']:['#47734d','#658b58','#a1b66d'];
      ctx.fillStyle='rgba(67,49,28,.20)';ctx.beginPath();ctx.ellipse(sx,sy+5,19,7,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#79543a';ctx.fillRect(sx-4,sy-14,8,20);ctx.fillStyle='#a9784d';ctx.fillRect(sx-1,sy-14,2,18);
      ctx.fillStyle=crown[0];ctx.fillRect(sx-20,sy-34,40,24);ctx.fillRect(sx-15,sy-42,30,12);ctx.fillRect(sx-12,sy-17,24,8);
      ctx.fillStyle=crown[1];ctx.fillRect(sx-25,sy-30,15,15);ctx.fillRect(sx+10,sy-30,15,15);ctx.fillRect(sx-15,sy-39,30,12);ctx.fillRect(sx-17,sy-21,34,8);
      ctx.fillStyle=crown[2];ctx.fillRect(sx-14,sy-37,11,7);ctx.fillRect(sx+3,sy-34,12,8);ctx.fillRect(sx-7,sy-24,14,6);
      const bloom=variant===4?'#e6a4ae':'#f0cf83';
      ctx.fillStyle=bloom;for(const [ox,oy] of [[-17,-31],[-8,-40],[8,-37],[18,-28],[-10,-20],[13,-18]]){ctx.fillRect(sx+ox,sy+oy,4,4);ctx.fillStyle='#fff0c7';ctx.fillRect(sx+ox+1,sy+oy+1,2,2);ctx.fillStyle=bloom;}
      return;
    }
    const greens=[['#315f46','#477d53','#6d9b60'],['#34694b','#51895a','#83a96a'],['#3a6947','#5d8c52','#8bac62'],['#315d4b','#4b805d','#72a46b']][variant%4];
    ctx.fillStyle='rgba(67,49,28,.22)';ctx.beginPath();ctx.ellipse(sx,sy+5,18,7,0,0,Math.PI*2);ctx.fill();
    // Curved, segmented trunk with a small highlight.
    ctx.fillStyle='#765039';ctx.fillRect(sx-5,sy-20,10,25);ctx.fillRect(sx-4,sy-27,8,10);
    ctx.fillStyle='#a9784c';ctx.fillRect(sx-2,sy-22,3,24);
    for(let i=0;i<4;i++){ctx.fillStyle='rgba(69,43,28,.25)';ctx.fillRect(sx-5,sy-15+i*6,10,1);}
    // Broad stepped crown, with overlapping fronds rather than thin spikes.
    ctx.fillStyle=greens[0];ctx.fillRect(sx-5,sy-39,10,12);ctx.fillRect(sx-17,sy-34,34,8);
    ctx.fillStyle=greens[1];
    ctx.fillRect(sx-27,sy-31,17,7);ctx.fillRect(sx+10,sy-31,17,7);
    ctx.fillRect(sx-22,sy-39,15,7);ctx.fillRect(sx+7,sy-39,15,7);
    ctx.fillRect(sx-14,sy-45,11,7);ctx.fillRect(sx+3,sy-45,11,7);
    ctx.fillRect(sx-31,sy-25,14,5);ctx.fillRect(sx+17,sy-25,14,5);
    ctx.fillStyle=greens[2];ctx.fillRect(sx-3,sy-40,6,8);ctx.fillRect(sx-18,sy-36,9,3);ctx.fillRect(sx+9,sy-36,9,3);
    ctx.fillRect(sx-13,sy-43,7,3);ctx.fillRect(sx+6,sy-43,7,3);
    // Fine leaf ribs and a cluster of dates make each palm feel less like a flat tile.
    ctx.fillStyle='rgba(197,220,137,.56)';
    ctx.fillRect(sx-18,sy-34,8,2);ctx.fillRect(sx+10,sy-34,8,2);
    ctx.fillRect(sx-12,sy-43,6,2);ctx.fillRect(sx+6,sy-43,6,2);
    ctx.fillStyle='#bd8b48';ctx.fillRect(sx+4,sy-20,3,5);ctx.fillRect(sx+8,sy-18,3,5);ctx.fillRect(sx+1,sy-17,3,4);
    if(variant===2){ctx.fillStyle='#e2ad61';ctx.fillRect(sx-7,sy-19,3,4);ctx.fillRect(sx-3,sy-17,3,4);}
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
    ctx.fillStyle='rgba(52,41,29,.25)';ctx.beginPath();ctx.ellipse(x+w/2,y+h-3,w*.47,18,0,0,Math.PI*2);ctx.fill();
    // Broad limestone body, arcade and patterned plinth.
    ctx.fillStyle='#b99f75';ctx.fillRect(x+15,y+63,w-30,h-66);
    ctx.fillStyle='#f0dfba';ctx.fillRect(x+21,y+55,w-42,h-69);
    ctx.fillStyle='#d5bd91';ctx.fillRect(x+21,y+h-25,w-42,12);
    ctx.fillStyle='#a9875d';for(let i=0;i<Math.floor((w-48)/18);i++)ctx.fillRect(x+27+i*18,y+h-22,8,3);
    // Side wings with teal arched windows.
    for(const wx of [x+47,x+w-75]){
      ctx.fillStyle='#e7d5af';ctx.fillRect(wx,y+85,28,76);
      ctx.fillStyle='#477f78';ctx.fillRect(wx+5,y+96,18,35);ctx.fillRect(wx+8,y+91,12,7);
      ctx.fillStyle='#d7bd8b';ctx.fillRect(wx+12,y+98,3,30);
      ctx.fillStyle='#fff0d0';ctx.fillRect(wx+2,y+88,24,3);
    }
    // Repeating arched windows, carved trim and a turquoise tile frieze.
    const facadeY=y+h-146;
    for(const wx of [x+62,x+118,x+w-156,x+w-100]){
      ctx.fillStyle='#b39a70';ctx.fillRect(wx-4,facadeY+5,40,58);
      ctx.fillStyle='#4a7f76';ctx.fillRect(wx,facadeY+11,32,48);
      ctx.fillStyle='#d9c49b';ctx.fillRect(wx+13,facadeY+14,6,43);
      ctx.fillStyle='#315f5b';ctx.fillRect(wx+4,facadeY+17,7,14);ctx.fillRect(wx+21,facadeY+17,7,14);
      ctx.fillStyle='#d6b779';ctx.fillRect(wx-6,facadeY+5,44,5);ctx.fillRect(wx+4,facadeY+59,32,4);
    }
    ctx.fillStyle='#4d8b7d';ctx.fillRect(x+32,y+h-91,w-64,5);
    ctx.fillStyle='#d7b56f';for(let i=0;i<Math.floor((w-72)/22);i++)ctx.fillRect(x+38+i*22,y+h-89,4,3);
    // Central geometric tile panel breaks up the broad limestone facade.
    const mx=x+w/2, my=y+h-258;
    ctx.fillStyle='#b99e72';ctx.fillRect(mx-45,my-4,90,82);
    ctx.fillStyle='#477c73';ctx.fillRect(mx-39,my+2,78,70);
    ctx.fillStyle='#ead9b7';ctx.fillRect(mx-31,my+9,62,56);
    ctx.fillStyle='#367268';ctx.fillRect(mx-25,my+14,50,46);
    ctx.fillStyle='#d8b56e';ctx.fillRect(mx-3,my+20,6,31);ctx.fillRect(mx-15,my+31,30,6);
    ctx.fillStyle='#f1d998';ctx.fillRect(mx-2,my+24,4,5);ctx.fillRect(mx-2,my+43,4,5);
    ctx.fillStyle='#e5d3ad';ctx.fillRect(mx-50,my+74,100,4);
    ctx.fillStyle='#d7b56f';
    for(const [ox,oy] of [[-104,my-y+30],[-82,my-y+30],[82,my-y+30],[104,my-y+30]]){ctx.fillRect(x+w/2+ox-2,y+oy,5,5);ctx.fillRect(x+w/2+ox,y+oy-2,1,9);}
    ctx.fillStyle='#4d8b7d';ctx.fillRect(x+34,y+112,w-68,3);ctx.fillRect(x+34,y+118,w-68,2);
    ctx.fillStyle='#e0bf79';for(let ix=0;ix<6;ix++){ctx.fillRect(x+43+ix*30,y+108,5,5);ctx.fillRect(x+45+ix*30,y+106,1,9);}
    // Main dome with layered base and crescent finial.
    ctx.fillStyle='#c9b17f';ctx.fillRect(x+w/2-59,y+34,118,18);
    ctx.fillStyle='#276c62';ctx.fillRect(x+w/2-53,y+22,106,31);ctx.fillRect(x+w/2-45,y+10,90,20);ctx.fillRect(x+w/2-32,y+2,64,14);
    ctx.fillStyle='#3d8e7b';ctx.fillRect(x+w/2-37,y+8,74,13);ctx.fillStyle='#78b49a';ctx.fillRect(x+w/2-25,y+10,20,5);
    ctx.fillStyle='#e0bc70';ctx.fillRect(x+w/2-2,y-5,4,9);ctx.fillRect(x+w/2-7,y-2,14,2);ctx.fillRect(x+w/2-2,y-9,4,4);
    // Two minarets with balconies and lantern-like crowns.
    for(const tx of [x+12,x+w-37]){
      ctx.fillStyle='#b89e74';ctx.fillRect(tx-3,y+23,26,110);ctx.fillStyle='#f0dfbf';ctx.fillRect(tx,y+26,20,104);
      ctx.fillStyle='#c6ad80';ctx.fillRect(tx-5,y+54,30,6);ctx.fillStyle='#e9d8b5';ctx.fillRect(tx-2,y+50,24,4);
      ctx.fillStyle='#3f8175';ctx.fillRect(tx+3,y+32,14,13);ctx.fillRect(tx+1,y+14,18,19);ctx.fillRect(tx+5,y+7,10,9);
      ctx.fillStyle='#d9b86f';ctx.fillRect(tx+9,y+1,2,8);ctx.fillRect(tx+6,y+5,8,2);
    }
    // Entrance arch and welcoming courtyard steps.
    const dx=x+w/2;
    ctx.fillStyle='#a17a4f';ctx.fillRect(dx-28,y+h-61,56,47);ctx.fillRect(dx-22,y+h-67,44,8);
    ctx.fillStyle='#594331';ctx.fillRect(dx-18,y+h-54,36,40);ctx.fillRect(dx-14,y+h-59,28,8);
    ctx.fillStyle='#d6b36b';ctx.fillRect(dx+8,y+h-37,3,3);
    ctx.fillStyle='#e8d8b5';ctx.fillRect(dx-42,y+h-12,84,5);ctx.fillRect(dx-34,y+h-7,68,4);
    // Decorative tile border.
    ctx.fillStyle='#4d8b7d';ctx.fillRect(x+31,y+169,w-62,4);ctx.fillStyle='#d5b16d';ctx.fillRect(x+31,y+175,w-62,2);
  }

  function drawHouse(b) {
    const x=b.x*TILE-camera.x, y=b.y*TILE-camera.y, w=b.w*TILE, h=b.h*TILE;
    const roof=b.kind==='house2'?'#b9684f':'#c17a51';
    ctx.fillStyle='rgba(52,39,25,.22)';ctx.beginPath();ctx.ellipse(x+w/2,y+h-5,w*.49,12,0,0,Math.PI*2);ctx.fill();
    // Warm plaster walls and layered terracotta roof.
    ctx.fillStyle='#c6aa7a';ctx.fillRect(x+7,y+43,w-14,h-55);
    ctx.fillStyle='#f0dfbd';ctx.fillRect(x+12,y+39,w-24,h-53);
    ctx.fillStyle='#a65e45';ctx.fillRect(x+3,y+29,w-6,20);ctx.fillRect(x+10,y+17,w-20,17);ctx.fillRect(x+20,y+8,w-40,13);
    ctx.fillStyle=roof;ctx.fillRect(x+6,y+25,w-12,17);ctx.fillRect(x+14,y+14,w-28,17);ctx.fillRect(x+24,y+6,w-48,11);
    ctx.fillStyle='#e0a16b';ctx.fillRect(x+10,y+27,w-20,3);ctx.fillRect(x+17,y+17,w-34,2);
    // Roof tiles.
    ctx.fillStyle='rgba(96,53,40,.25)';for(let yy=0;yy<3;yy++)for(let xx=0;xx<Math.floor((w-24)/17);xx++)ctx.fillRect(x+14+xx*17+(yy%2)*5,y+31+yy*5,9,2);
    // Windows with wooden shutters.
    for(const wx of [x+23,x+w-43]){
      ctx.fillStyle='#765039';ctx.fillRect(wx-3,y+55,24,27);ctx.fillStyle='#4d827b';ctx.fillRect(wx,y+58,18,21);
      ctx.fillStyle='#e8d8b4';ctx.fillRect(wx+8,y+58,2,21);ctx.fillRect(wx,y+67,18,2);
      ctx.fillStyle='#b77a4d';ctx.fillRect(wx-4,y+54,4,29);ctx.fillRect(wx+20,y+54,4,29);
    }
    // Small tiled roof crest and a patterned banner give each home its own character.
    const roofCx=x+w/2;
    ctx.fillStyle='#8c563f';ctx.fillRect(roofCx-17,y+2,34,7);ctx.fillStyle='#e4b66b';ctx.fillRect(roofCx-12,y+1,24,3);
    ctx.fillStyle=roof;ctx.fillRect(roofCx-5,y-5,10,8);ctx.fillStyle='#e9c47c';ctx.fillRect(roofCx-2,y-9,4,5);
    ctx.fillStyle='#b77b4c';ctx.fillRect(x+9,y+45,w-18,3);ctx.fillStyle='#f0d8a8';ctx.fillRect(x+13,y+46,w-26,1);
    // Arched wooden front door.
    const cx=x+w/2;ctx.fillStyle='#684933';ctx.fillRect(cx-13,y+h-51,26,39);ctx.fillRect(cx-9,y+h-57,18,9);
    ctx.fillStyle='#9a6a43';ctx.fillRect(cx-9,y+h-47,18,32);ctx.fillStyle='#e1bd75';ctx.fillRect(cx+5,y+h-33,3,3);
    ctx.fillStyle='#d4b889';ctx.fillRect(cx-19,y+h-12,38,4);ctx.fillRect(cx-15,y+h-8,30,3);
    // Hanging lantern and flower pots.
    ctx.fillStyle='#74513a';ctx.fillRect(x+w-28,y+43,2,11);ctx.fillStyle='#e5b95e';ctx.fillRect(x+w-32,y+51,10,10);ctx.fillStyle='#fff0b4';ctx.fillRect(x+w-29,y+54,4,4);
    ctx.fillStyle='#9e6247';ctx.fillRect(x+17,y+h-19,12,8);ctx.fillStyle='#6e9a60';ctx.fillRect(x+19,y+h-25,3,8);ctx.fillRect(x+24,y+h-27,4,9);
  }

  function drawLibrary(b) {
    const x=b.x*TILE-camera.x,y=b.y*TILE-camera.y,w=b.w*TILE,h=b.h*TILE;
    drawHouseShell(x,y,w,h,'#638b78','#477568');
    ctx.fillStyle='#684a37';ctx.fillRect(x+21,y+51,24,28);ctx.fillRect(x+w-45,y+51,24,28);
    ctx.fillStyle='#d5b477';ctx.fillRect(x+25,y+55,16,20);ctx.fillRect(x+w-41,y+55,16,20);
    ctx.fillStyle='#493c30';ctx.fillRect(x+w/2-11,y+h-51,22,39);ctx.fillRect(x+w/2-8,y+h-57,16,8);
    ctx.fillStyle='#e4bf76';ctx.fillRect(x+w/2+5,y+h-34,2,3);
    ctx.fillStyle='#f1e2c1';ctx.fillRect(x+12,y+38,w-24,4);
    ctx.fillStyle='#4d766a';ctx.fillRect(x+w/2-21,y+6,42,8);ctx.fillRect(x+w/2-14,y,28,8);
    ctx.fillStyle='#d7bc82';ctx.fillRect(x+w/2-3,y+1,6,11);
  }

  function drawInn(b) {
    const x=b.x*TILE-camera.x,y=b.y*TILE-camera.y,w=b.w*TILE,h=b.h*TILE;
    drawHouseShell(x,y,w,h,'#c18a59','#9b6746');
    ctx.fillStyle='#75503a';ctx.fillRect(x+17,y+54,20,25);ctx.fillRect(x+w-37,y+54,20,25);
    ctx.fillStyle='#4e817b';ctx.fillRect(x+20,y+57,14,19);ctx.fillRect(x+w-34,y+57,14,19);
    ctx.fillStyle='#ddbf84';ctx.fillRect(x+w/2-24,y+49,48,4);
    ctx.fillStyle='#604630';ctx.fillRect(x+w/2-14,y+h-51,28,39);ctx.fillRect(x+w/2-10,y+h-57,20,8);
    ctx.fillStyle='#e6bd70';ctx.fillRect(x+w/2+5,y+h-34,3,3);
    ctx.fillStyle='#f1d9a9';ctx.fillRect(x+12,y+39,w-24,4);
  }

  function drawHouseShell(x,y,w,h,roofColor,trimColor){
    ctx.fillStyle='rgba(52,39,25,.22)';ctx.beginPath();ctx.ellipse(x+w/2,y+h-5,w*.48,11,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c5a779';ctx.fillRect(x+7,y+42,w-14,h-54);ctx.fillStyle='#eee0bf';ctx.fillRect(x+12,y+39,w-24,h-52);
    ctx.fillStyle=trimColor;ctx.fillRect(x+3,y+29,w-6,19);ctx.fillRect(x+11,y+17,w-22,17);ctx.fillRect(x+21,y+8,w-42,12);
    ctx.fillStyle=roofColor;ctx.fillRect(x+7,y+26,w-14,18);ctx.fillRect(x+15,y+15,w-30,17);ctx.fillRect(x+25,y+6,w-50,12);
    ctx.fillStyle='rgba(255,225,183,.3)';ctx.fillRect(x+12,y+28,w-24,2);ctx.fillRect(x+19,y+17,w-38,2);
  }
  function drawStall(s, i) {
    const x=s.x*TILE-camera.x, y=s.y*TILE-camera.y, w=s.w*TILE, h=s.h*TILE;
    ctx.fillStyle='rgba(39,37,27,.22)';ctx.fillRect(x+4,y+h-3,w-5,8);
    ctx.fillStyle='#76533b';ctx.fillRect(x+8,y+28,w-16,h-28);
    ctx.fillStyle='#6b4935';ctx.fillRect(x+5,y+7,4,h-5);ctx.fillRect(x+w-9,y+7,4,h-5);
    ctx.fillStyle=s.color;ctx.fillRect(x+2,y+8,w-4,22);
    for(let k=0;k<5;k++) { ctx.fillStyle=k%2===0?s.cloth:'#f7e8c9';ctx.fillRect(x+2+k*(w-4)/5,y+8,(w-4)/5+1,22); }
    ctx.fillStyle='#d5b477';ctx.fillRect(x+5,y+29,w-10,4);ctx.fillStyle='#f0d59a';ctx.fillRect(x+8,y+32,w-16,2);
    // Colorful little piles of fruit, spices and folded cloth.
    const goods=['#c45d49','#d8a443','#6f9b69','#a76d88','#e5c16e'];
    for(let k=0;k<5;k++){ctx.fillStyle=goods[(k+i)%goods.length];ctx.fillRect(x+11+k*15,y+35,9,7);ctx.fillStyle='rgba(255,238,190,.65)';ctx.fillRect(x+13+k*15,y+36,3,2);}
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
    rocks.forEach(([x,y])=>{if(x*TILE-camera.x>-25&&x*TILE-camera.x<VIEW_W/ZOOM+25&&y*TILE-camera.y>-25&&y*TILE-camera.y<VIEW_H/ZOOM+25)drawRock(x,y);});
    cacti.forEach(([x,y])=>{if(x*TILE-camera.x>-25&&x*TILE-camera.x<VIEW_W/ZOOM+25&&y*TILE-camera.y>-25&&y*TILE-camera.y<VIEW_H/ZOOM+25)drawCactus(x,y);});
    const y0=Math.max(2,Math.floor(camera.y/TILE)-1),y1=Math.min(MAP_H-1,Math.ceil((camera.y+VIEW_H/ZOOM)/TILE)+1);
    const x0=Math.max(2,Math.floor(camera.x/TILE)-1),x1=Math.min(MAP_W-1,Math.ceil((camera.x+VIEW_W/ZOOM)/TILE)+1);
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) {
      const kind=rand(x,y,8);
      if(kind>.966 && map[y][x]===T.GRASS && !(x>18&&x<28&&y>10&&y<22)){
        const sx=x*TILE-camera.x+12,sy=y*TILE-camera.y+18;
        ctx.fillStyle='#3e7049';ctx.fillRect(sx-5,sy-2,10,6);ctx.fillStyle='#65965b';ctx.fillRect(sx-3,sy-5,7,5);
        ctx.fillStyle='#9fba75';ctx.fillRect(sx-1,sy-6,3,2);
      }
      if(rand(x,y,9)>.970&&map[y][x]===T.GRASS){
        const sx=x*TILE-camera.x+17,sy=y*TILE-camera.y+18;
        ctx.fillStyle='#4f8553';ctx.fillRect(sx,sy,2,5);ctx.fillStyle=rand(x,y,15)>.5?'#efc3a2':'#f1dc8e';ctx.fillRect(sx-2,sy-2,3,3);ctx.fillRect(sx+1,sy-3,3,3);ctx.fillStyle='#e5a96a';ctx.fillRect(sx,sy-1,2,2);
      }
      if(rand(x,y,23)>.995&&map[y][x]===T.SAND){
        const sx=x*TILE-camera.x+9,sy=y*TILE-camera.y+14;ctx.fillStyle='rgba(255,238,197,.4)';ctx.fillRect(sx,sy,5,1);ctx.fillRect(sx+3,sy+3,2,1);
      }
    }
    // Decorative lantern posts around the main town and bridge approach.
    const lanterns=[[86,64],[106,64],[77,78],[103,78],[88,62],[97,62],[116,72],[133,82],[29,79],[39,79],[82,86],[109,86],[70,88],[111,91],[150,87],[156,96]];
    lanterns.forEach(([tx,ty],i)=>{
      const sx=tx*TILE-camera.x+16,sy=ty*TILE-camera.y+16;
      if(sx<-30||sx>VIEW_W/ZOOM+30||sy<-35||sy>VIEW_H/ZOOM+35)return;
      ctx.fillStyle='rgba(52,39,25,.2)';ctx.fillRect(sx-6,sy+9,12,4);
      ctx.fillStyle='#76513a';ctx.fillRect(sx-2,sy-10,4,20);ctx.fillRect(sx-5,sy-13,10,3);
      ctx.fillStyle='#d4ad65';ctx.fillRect(sx-5,sy-23,10,11);ctx.fillStyle='#f2cf83';ctx.fillRect(sx-3,sy-21,6,7);
      ctx.fillStyle='rgba(250,205,113,.16)';ctx.beginPath();ctx.arc(sx,sy-17,13,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#806044';ctx.fillRect(sx-6,sy-25,12,3);ctx.fillRect(sx-1,sy-28,2,4);
    });
    // Potted flowers add colour around the central courtyard and important doors.
    const pots=[[87,76],[98,76],[75,79],[105,79],[84,64],[100,64],[141,86],[149,86],[30,84],[38,84],[80,58],[110,58],[81,85],[109,85],[68,89],[114,90],[146,92],[154,88]];
    pots.forEach(([tx,ty],i)=>{
      const sx=tx*TILE-camera.x+16,sy=ty*TILE-camera.y+19;
      if(sx<-20||sx>VIEW_W/ZOOM+20||sy<-20||sy>VIEW_H/ZOOM+20)return;
      ctx.fillStyle='#9d6247';ctx.fillRect(sx-5,sy,10,7);ctx.fillStyle='#d18b5f';ctx.fillRect(sx-6,sy-2,12,3);
      ctx.fillStyle='#477e50';ctx.fillRect(sx-1,sy-10,3,9);ctx.fillRect(sx-6,sy-8,5,3);ctx.fillRect(sx+2,sy-7,5,3);
      ctx.fillStyle=i%2?'#e6a3a0':'#f0cf7f';ctx.fillRect(sx-3,sy-13,4,4);ctx.fillRect(sx+2,sy-12,4,4);ctx.fillStyle='#f7e7b4';ctx.fillRect(sx,sy-11,2,2);
    });
    // A small patterned rug at the main market entrance.
    const rx=91*TILE-camera.x-34,ry=68*TILE-camera.y+4;
    if(rx<VIEW_W&&rx+68>0&&ry<VIEW_H&&ry+25>0){
      ctx.fillStyle='#a94f45';ctx.fillRect(rx,ry,68,25);ctx.fillStyle='#e5c27b';ctx.fillRect(rx+4,ry+4,60,17);ctx.fillStyle='#4e7f72';ctx.fillRect(rx+8,ry+7,52,11);ctx.fillStyle='#d7aa62';ctx.fillRect(rx+12,ry+10,44,5);ctx.fillStyle='#f3d9a3';ctx.fillRect(rx+2,ry+2,3,21);ctx.fillRect(rx+63,ry+2,3,21);
    }
  }

  const spritePalettes={
    player:{robe:'#4f9187',shade:'#326b65',light:'#8fc2a8',wrap:'#f2e5c9',wrapShade:'#bca783',skin:'#f0bd98',hair:'#49342e',boots:'#674a39',gold:'#e1bd70',cheek:'#e58e91',eyes:'#3b2c2c'},
    merchant:{robe:'#c87556',shade:'#8e4c3e',light:'#e8a078',wrap:'#e7c88d',wrapShade:'#ae8854',skin:'#d99a73',hair:'#49332a',boots:'#674735',gold:'#efce86',cheek:'#df8c83',eyes:'#362727'},
    gardener:{hijab:true,robe:'#6c9b70',shade:'#426a4d',light:'#a6c78a',wrap:'#f1d6b0',wrapShade:'#b18b65',skin:'#e8b18f',hair:'#56382f',boots:'#654833',gold:'#dfc17c',cheek:'#e88f91',eyes:'#3e2e2b'},
    traveler:{robe:'#5d83a4',shade:'#3c5f7b',light:'#9db9cf',wrap:'#e8d4a8',wrapShade:'#aa9168',skin:'#e7b48f',hair:'#48352d',boots:'#624735',gold:'#dfc17a',cheek:'#e68c8b',eyes:'#352c2b'},
    guard:{robe:'#b58a4f',shade:'#795c35',light:'#d9b877',wrap:'#f0dfba',wrapShade:'#b49a71',skin:'#d99b77',hair:'#46342b',boots:'#614632',gold:'#e9c875',cheek:'#df8c83',eyes:'#3e2d2a'},
    scholar:{hijab:true,robe:'#9381b3',shade:'#665681',light:'#c4b1d7',wrap:'#eccfbd',wrapShade:'#a77b78',skin:'#edb99a',hair:'#503a35',boots:'#674a46',gold:'#e6c27d',cheek:'#e88b96',eyes:'#3d2c39'},
    fisher:{robe:'#a47a51',shade:'#735034',light:'#d4aa72',wrap:'#e7d8b6',wrapShade:'#ad9874',skin:'#d99a75',hair:'#48372e',boots:'#624731',gold:'#e1bf75',cheek:'#e18b83',eyes:'#382c28'},
    child:{hijab:true,robe:'#d77c75',shade:'#9b4f59',light:'#f2a8a0',wrap:'#f4d8af',wrapShade:'#ba9071',skin:'#f0c3a2',hair:'#573a31',boots:'#704a3b',gold:'#f0d18a',cheek:'#f18f9b',eyes:'#30252c'}
  };
  const spriteCache=new Map();
  // Hand-finished chibi sprite atlases: four directions × four walking frames.
  // Female villagers retain their own modest head-covering sprite style below.
  const spriteAtlasFiles={
    player:'assets/chibi-teal.png',
    merchant:'assets/chibi-terracotta.png',
    traveler:'assets/chibi-blue.png',
    guard:'assets/chibi-ochre.png',
    fisher:'assets/chibi-plum.png',
    farmer:'assets/chibi-ochre.png',
    northman:'assets/chibi-terracotta.png'
  };
  const spriteAtlases={};
  if(typeof Image!=='undefined'){
    for(const [name,src] of Object.entries(spriteAtlasFiles)){
      const image=new Image();image.src=src;spriteAtlases[name]=image;
    }
  }
  function makeSprite(paletteName,dir,frame){
    const key=`${paletteName}:${dir}:${frame}`;
    if(spriteCache.has(key))return spriteCache.get(key);
    const p=spritePalettes[paletteName]||spritePalettes.player;
    const c=document.createElement('canvas');c.width=36;c.height=44;
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const px=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
    const row=(y,x,w,color)=>px(x,y,w,1,color);
    const walking=frame!==0;
    const step=frame===1?2:frame===3?-2:frame===2?1:0;
    const bob=frame===1?1:frame===3?-1:0;

    // Tiny feet and legs: the robe stays the visual focus.
    px(12+step,38,5,3,p.shade);px(21-step,38,5,3,p.shade);
    px(11+step,40,7,3,p.boots);px(20-step,40,7,3,p.boots);
    px(13+step,40,2,1,p.gold);px(22-step,40,2,1,p.gold);

    // Rounded sleeves and a little bell-shaped tunic.
    px(12,24+bob,12,3,p.wrapShade);
    px(9,26+bob,18,9,p.shade);
    px(10,26+bob,16,8,p.robe);
    px(13,27+bob,10,6,p.light);
    px(11,34+bob,14,2,p.shade);
    px(15,34+bob,6,1,p.gold);
    const swing=walking?step:0;
    px(6,27+bob+swing,4,6,p.shade);px(7,27+bob+swing,3,5,p.robe);
    px(7,32+bob+swing,3,2,p.skin);
    px(26,27+bob-swing,4,6,p.shade);px(26,27+bob-swing,3,5,p.robe);
    px(26,32+bob-swing,3,2,p.skin);

    // Rounded, oversized head silhouette with soft stepped corners.
    const edge=p.hijab?p.wrapShade:p.hair;
    [[2,14,8],[3,10,16],[4,7,22],[5,5,26],[6,4,28]].forEach(([y,x,w])=>row(y,x,w,edge));
    for(let y=7;y<=19;y++)row(y,3,30,edge);
    row(20,4,28,edge);row(21,6,24,edge);row(22,9,18,edge);row(23,13,10,edge);

    if(p.hijab){
      // Cream scarf with a rounded crown, soft cheek framing and shoulder folds.
      [[4,12,12],[5,8,20],[6,6,24],[7,5,26]].forEach(([y,x,w])=>row(y,x,w,p.wrap));
      for(let y=8;y<=18;y++)row(y,5,26,p.wrap);
      row(19,6,24,p.wrap);row(20,8,20,p.wrap);row(21,11,14,p.wrap);
      px(4,13,3,7,p.wrapShade);px(29,13,3,7,p.wrapShade);
      px(7,19,5,3,p.wrapShade);px(24,19,5,3,p.wrapShade);
      px(26,21,3,3,p.gold);px(27,21,1,1,'#fff5d7');
    }else{
      // A small rounded kufi / wrapped cap and soft side locks.
      [[3,13,10],[4,10,16],[5,8,20],[6,8,20],[7,10,16]].forEach(([y,x,w])=>row(y,x,w,p.wrapShade));
      row(4,11,14,p.wrap);row(5,9,18,p.wrap);row(6,10,16,p.wrap);
      px(4,11,3,8,p.hair);px(29,11,3,8,p.hair);
      px(7,17,3,4,p.hair);px(26,17,3,4,p.hair);
    }

    if(dir==='down'){
      // Small peach face, gentle eyes, tiny smile and warm cheek pixels.
      row(8,11,14,p.skin);row(9,8,20,p.skin);
      for(let y=10;y<=18;y++)row(y,7,22,p.skin);
      row(19,9,18,p.skin);row(20,13,10,p.skin);
      if(!p.hijab){px(7,9,4,2,p.hair);px(25,9,4,2,p.hair);}
      // Eyes are deliberately smaller than the previous version and have a soft highlight.
      px(10,13,5,5,'#704a42');px(21,13,5,5,'#704a42');
      px(11,13,3,4,p.eyes);px(22,13,3,4,p.eyes);
      px(11,13,2,2,'#fffaf0');px(22,13,2,2,'#fffaf0');
      px(12,16,1,1,'#252321');px(23,16,1,1,'#252321');
      px(7,18,3,2,p.cheek);px(26,18,3,2,p.cheek);
      px(17,20,2,1,'#a96861');
      px(16,18,1,1,'#f7d4ad');
    }else if(dir==='left'||dir==='right'){
      row(9,10,16,p.skin);row(10,8,20,p.skin);
      for(let y=11;y<=18;y++)row(y,7,22,p.skin);
      row(19,10,16,p.skin);row(20,13,10,p.skin);
      if(dir==='left'){
        px(8,13,5,5,'#704a42');px(9,13,3,4,p.eyes);px(9,13,2,2,'#fffaf0');
        px(7,18,3,2,p.cheek);px(17,20,2,1,'#a96861');px(25,10,4,7,p.hijab?p.wrap:p.hair);
      }else{
        px(23,13,5,5,'#704a42');px(24,13,3,4,p.eyes);px(24,13,2,2,'#fffaf0');
        px(26,18,3,2,p.cheek);px(17,20,2,1,'#a96861');px(7,10,4,7,p.hijab?p.wrap:p.hair);
      }
    }else{
      // Rear view: keep the scarf / hair rounded and the robe readable.
      if(p.hijab){
        for(let y=8;y<=18;y++)row(y,5,26,p.wrap);
        row(19,7,22,p.wrap);row(20,10,16,p.wrapShade);row(21,13,10,p.wrapShade);
        px(11,10,14,2,p.light);px(13,15,10,2,p.wrapShade);
      }else{
        for(let y=8;y<=18;y++)row(y,4,28,p.hair);
        row(19,7,22,p.hair);row(20,10,16,p.hair);
        row(3,13,10,p.wrapShade);row(4,10,16,p.wrap);row(5,8,20,p.wrap);row(6,10,16,p.wrapShade);
      }
    }
    // Small collar detail and a subtle highlight on the garment.
    px(16,24,4,2,p.gold);px(17,24,2,1,'#fff0c8');
    px(14,29+bob,2,3,'rgba(255,255,255,.18)');
    if(paletteName==='player'){px(27,29,4,5,'#986344');px(28,30,2,3,'#dbb66c');px(28,30,1,1,'#fff0c3');}
    spriteCache.set(key,c);
    return c;
  }

  function drawActor(actor,isPlayer=false){
    const sx=Math.round(actor.x-camera.x),sy=Math.round(actor.y-camera.y);
    const frame=actor.moving?Math.floor(actor.walk*7.5)%4:0;
    const directionRow={down:0,left:1,right:2,up:3}[actor.dir||'down']??0;
    const atlas=spriteAtlases[actor.palette||'player']||spriteAtlases.player;
    ctx.fillStyle='rgba(48,39,28,.20)';ctx.beginPath();ctx.ellipse(sx,sy-1,13,5,0,0,Math.PI*2);ctx.fill();
    if(atlas&&atlas.complete&&(atlas.naturalWidth||atlas.width)>0){
      // Each source cell is 192×256: rows are directions, columns are walk frames.
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(atlas,frame*192,directionRow*256,192,256,sx-31,sy-82,62,82);
    }else{
      const sprite=makeSprite(actor.palette||'player',actor.dir||'down',frame);
      ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,sx-30,sy-73,60,73);
    }
    if(!isPlayer&&Math.hypot(player.x-actor.x,player.y-actor.y)<92){
      ctx.font='bold 11px Manrope,sans-serif';ctx.textAlign='center';
      const label=actor.name,w=ctx.measureText(label).width+14;
      ctx.fillStyle='rgba(35,48,38,.88)';roundRect(ctx,sx-w/2,sy-82,w,17,5);ctx.strokeStyle='rgba(240,211,151,.7)';ctx.strokeRect(sx-w/2,sy-82,w,17);
      ctx.fillStyle='#fff3d8';ctx.fillText(label,sx,sy-70);
    }
  }
  function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}

  function drawNPC(n,time){drawActor(n,false);}
  function drawPlayer(time){drawActor(player,true);}

  function drawWorld(time) {
    ctx.setTransform(1,0,0,1,0,0);
    if(scene==='interior'){drawInterior(time);return;}
    ctx.clearRect(0,0,VIEW_W,VIEW_H);
    ctx.save();ctx.setTransform(ZOOM,0,0,ZOOM,0,0);
    const startX=clamp(Math.floor(camera.x/TILE),0,MAP_W-1), startY=clamp(Math.floor(camera.y/TILE),0,MAP_H-1);
    const endX=clamp(Math.ceil((camera.x+VIEW_W/ZOOM)/TILE)+1,0,MAP_W), endY=clamp(Math.ceil((camera.y+VIEW_H/ZOOM)/TILE)+1,0,MAP_H);
    for(let y=startY;y<endY;y++) for(let x=startX;x<endX;x++) drawGroundTile(x,y,Math.floor(x*TILE-camera.x),Math.floor(y*TILE-camera.y));
    drawDecoration();
    const layers=[];
    trees.forEach(t=>{if(t.x-camera.x>-45&&t.x-camera.x<VIEW_W/ZOOM+45&&t.y-camera.y>-55&&t.y-camera.y<VIEW_H/ZOOM+45)layers.push({y:t.y,draw:()=>drawPalm(t.x,t.y,t.variant)});});
    buildings.forEach(b=>layers.push({y:(b.y+b.h)*TILE-8,draw:()=>{if(b.kind==='mosque')drawMosque(b);else if(b.kind==='house')drawHouse(b);else if(b.kind==='library')drawLibrary(b);else drawInn(b);}}));
    stalls.forEach(st=>layers.push({y:(st.y+st.h)*TILE,draw:()=>drawStall(st,0)}));
    layers.push({y:86*TILE,draw:drawWell},{y:103*TILE,draw:drawGarden});
    landmarks.forEach(l=>{if(l.type==='board')layers.push({y:l.y,draw:()=>{const bx=l.x-camera.x,by=l.y-camera.y;ctx.fillStyle='#684a33';ctx.fillRect(bx-3,by-3,6,23);ctx.fillStyle='#bd9257';ctx.fillRect(bx-14,by-13,28,14);ctx.fillStyle='#73563a';ctx.fillRect(bx-9,by-8,18,2);ctx.fillRect(bx-9,by-3,13,2);}});});
    npcs.forEach(n=>layers.push({y:n.y,draw:()=>drawNPC(n,time)}));layers.push({y:player.y,draw:()=>drawPlayer(time)});
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
    // Gold quest marker guides the player to the next objective.
    let questTarget=null;
    if(questStage===0) questTarget=npcs.find(n=>n.id==='merchant');
    else if(questStage===1) questTarget=landmarks.find(l=>l.id==='market');
    else if(questStage===2) questTarget=npcs.find(n=>n.id==='gardener');
    if(questTarget){
      const qx=questTarget.x-camera.x, qy=questTarget.y-camera.y-53;
      if(qx>-20&&qx<VIEW_W/ZOOM+20&&qy>-35&&qy<VIEW_H/ZOOM+20){
        const pulse=1+Math.sin(time/210)*.12;ctx.save();ctx.translate(qx,qy);ctx.scale(pulse,pulse);
        ctx.fillStyle='rgba(248,197,83,.22)';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#f4c45f';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fff4cf';ctx.fillRect(-2,-3,4,6);ctx.restore();
      }
    }
    // Time-of-day tint.
    const minutes=gameMinutes%1440, hour=minutes/60;
    let alpha=0;
    if(hour<5.5) alpha=.43;
    else if(hour<7) alpha=.43*(7-hour)/1.5;
    else if(hour>18.5) alpha=Math.min(.48,(hour-18.5)/3.5*.48);
    if(alpha>0){ctx.fillStyle=`rgba(23,35,63,${alpha})`;ctx.fillRect(0,0,VIEW_W/ZOOM,VIEW_H/ZOOM);}
    if(hour>=16.5&&hour<=18.5){const a=.07*Math.sin((hour-16.5)/2*Math.PI);ctx.fillStyle=`rgba(218,126,65,${a})`;ctx.fillRect(0,0,VIEW_W/ZOOM,VIEW_H/ZOOM);}
    ctx.restore();
  }

  function drawMinimap() {
    const sx=mini.width/MAP_W, sy=mini.height/MAP_H;
    mctx.clearRect(0,0,mini.width,mini.height);
    const colors={ [T.SAND]:'#c9a66b',[T.GRASS]:'#6e965e',[T.ROAD]:'#b88f5a',[T.STONE]:'#c6b58a',[T.WATER]:'#4d91a0',[T.DIRT]:'#997246',[T.TILE]:'#7b6040',[T.DECK]:'#825d40' };
    for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++){mctx.fillStyle=colors[map[y][x]];mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));}
    // Building markers.
    buildings.forEach(b=>{mctx.fillStyle=b.kind==='mosque'?'#f5edcf':'#ac7151';mctx.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);});
    if(questStage<3){const target=questStage===0?npcs.find(n=>n.id==='merchant'):questStage===1?landmarks.find(l=>l.id==='market'):npcs.find(n=>n.id==='gardener');if(target){mctx.fillStyle='#ffd15f';mctx.fillRect((target.x/WORLD_W)*mini.width-2,(target.y/WORLD_H)*mini.height-2,5,5);}}
    mctx.fillStyle='#fff2c8';mctx.fillRect((player.x/WORLD_W)*mini.width-2,(player.y/WORLD_H)*mini.height-2,4,4);
    mctx.strokeStyle='rgba(255,255,255,.7)';mctx.lineWidth=1;mctx.strokeRect(0,0,mini.width,mini.height);
  }

  function getNearestTarget() {
    if(scene==='interior'){
      const d=Math.hypot(player.x-VIEW_W/2,player.y-(VIEW_H-100));
      return d<66?{type:'exit',name:'Pintu keluar'}:null;
    }
    let best=null,bestD=Infinity;
    for(const b of buildings){const d=Math.hypot(player.x-b.doorX,player.y-b.doorY);if(d<58&&d<bestD){best={type:'door',name:b.name,building:b};bestD=d;}}
    for(const n of npcs){const d=Math.hypot(player.x-n.x,player.y-n.y);if(d<84&&d<bestD){best={type:'npc',name:n.name,npc:n};bestD=d;}}
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
    openModal('Pasar Rempah Nuraya',`<p>Yusuf menyambutmu di kiosnya. Pilih barang yang ingin dibeli. Setiap barang akan masuk ke dalam tasmu. <b>Kurma pilihan</b> diperlukan untuk misi kebun kurma.</p><div id="shopList">${rows}</div><p style="font-size:11px;color:#e6c78b;margin-top:9px">Uangmu: <b id="shopCoins">${coins} koin</b></p>`,[{label:'Selesai',secondary:true,run:closeModal}],'PERDAGANGAN');
    ui.content.querySelectorAll('[data-buy]').forEach(button=>button.addEventListener('click',()=>{
      const item=goods.find(g=>g.id===button.dataset.buy);if(!item)return;
      if(coins<item.price){showToast('Koinmu belum cukup untuk membeli barang itu.');return;}
      coins-=item.price;addItem(item.id,item.name);if(item.id==='dates'&&questStage===1){questStage=2;showToast('Kurma didapat! Sekarang antarkan kepada Maryam di kebun timur.',4);}updateHud();
      const coinNode=ui.content.querySelector('#shopCoins');if(coinNode)coinNode.textContent=`${coins} koin`;
      showToast(`${item.name} masuk ke dalam tas.`);
    }));
  }
  function openInventory() {
    const rows=inventory.map(i=>`<div class="inventory-row"><span class="shop-item-name">${i.name}</span><b>× ${i.qty}</b></div>`).join('');
    openModal('Tas perjalanan',inventory.length?`<p>Barang-barang yang sedang kamu bawa:</p>${rows}`:'<div class="empty-note">Tasmu masih kosong. Coba kunjungi Pasar Rempah Nuraya untuk membeli bekal.</div>',[{label:'Tutup',secondary:true,run:closeModal}],'INVENTARIS');
  }
  function openJournal() {
    const descriptions=[
      'Temui Yusuf di Pasar Nuraya. Ia membutuhkan bantuan untuk mengenalkan kurma dari kebun Maryam.',
      'Yusuf sudah menjelaskan tugasnya. Beli satu paket kurma di kios Pasar Rempah Nuraya.',
      'Kurma sudah ada di tasmu. Pergilah ke Kebun Kurma Timur dan temui Maryam.',
      'Misi selesai! Kamu telah membantu Yusuf dan Maryam. Hadiah 35 koin sudah diterima.'
    ];
    const status=['Belum dimulai','Berlangsung · Cari kurma','Berlangsung · Antar kurma','Selesai'];
    openModal('Jurnal perjalanan',`<p><b>Bantuan untuk kebun kurma</b></p><p>${descriptions[questStage]}</p><p><b>Status:</b> ${status[questStage]}</p><p style="color:#e4c58b;font-size:11px">Petunjuk: penanda emas di atas kepala orang atau tempat menunjukkan tujuan misi berikutnya.</p>`,[{label:'Kembali bermain',secondary:true,run:closeModal}],'JURNAL MISI');
  }

  function enterBuilding(b){
    returnPosition={x:player.x,y:player.y,location:currentLocation};currentBuilding=b;scene='interior';
    player.x=VIEW_W/2;player.y=VIEW_H-150;player.dir='down';player.moving=false;currentLocation=b.name;updateHud();
    showToast(`Memasuki ${b.name}. Tekan E di dekat pintu untuk keluar.`);
  }
  function exitBuilding(){
    scene='world';player.x=returnPosition?.x??player.x;player.y=(returnPosition?.y??player.y)+78;
    player.dir='up';currentBuilding=null;currentLocation=returnPosition?.location||'Kota Nuraya';returnPosition=null;updateHud();
    showToast('Kamu kembali ke jalanan Nuraya.');
  }
  function drawInterior(time){
    ctx.setTransform(1,0,0,1,0,0);
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
        if(n.id==='merchant') {
          if(questStage===0){
            extra='<p>“Aku perlu mengirim satu paket kurma pilihan kepada Maryam di kebun timur. Bisa bantu membelinya di kiosku?”</p>';
            questStage=1;updateQuestHud();
          } else if(questStage===1) extra='<p>“Terima kasih sudah membantu! Beli satu paket kurma dari kiosku, ya.”</p>';
          else if(questStage===2) extra='<p>“Kurma sudah kamu dapatkan. Sekarang antarkan kepada Maryam di Kebun Kurma Timur.”</p>';
          else extra='<p>“Terima kasih lagi sudah membantu kebun Maryam!”</p>';
          extra += '<p>“Kios pasar berada sedikit ke utara dari sini.”</p>';
        }
        if(n.id==='gardener'){
          if(questStage===2&&inventory.some(i=>i.id==='dates'&&i.qty>0)) extra='<p>“Wah, kamu membawa kurma dari Yusuf! Bolehkah aku menerimanya untuk kebun?”</p>';
          else if(questStage<2) extra='<p>“Aku sedang merawat kebun. Yusuf biasanya menjual kurma pilihan di pasar kota.”</p>';
          else extra='<p>“Terima kasih sudah membantu. Kebun ini akan memasok kurma untuk para pengunjung.”</p>';
        }
        openModal(n.name,`<p style="color:#dbbd84;font-size:11px;font-weight:700">${n.role}</p><p>${n.line}</p>${extra}`,[{label:'Lanjutkan perjalanan',secondary:true,run:closeModal}],'PERCAKAPAN');
        if(n.id==='gardener'&&questStage===2&&inventory.some(i=>i.id==='dates'&&i.qty>0)){
          ui.actions.innerHTML='';
          const deliver=document.createElement('button');deliver.className='modal-action';deliver.textContent='Berikan 1 paket kurma';deliver.onclick=()=>{
            const item=inventory.find(i=>i.id==='dates');item.qty--;if(item.qty<=0)inventory=inventory.filter(i=>i.id!=='dates');
            questStage=3;deliveredQuest=true;coins+=35;updateHud();
            openModal('Misi selesai!', '<p>Maryam menerima kurma itu dengan senang hati.</p><p>“Terima kasih sudah membantu. Semoga kebaikanmu kembali kepadamu.”</p><p><b>Hadiah: 35 koin dan reputasi baik.</b></p>',[{label:'Alhamdulillah',secondary:true,run:closeModal}],'MISI SELESAI');
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
    const data={x:scene==='world'?player.x:(returnPosition?.x??player.x),y:scene==='world'?player.y:(returnPosition?.y??player.y),coins,inventory,gameMinutes,day,questStage,deliveredQuest};
    try{localStorage.setItem('jejakNurSaveV5',JSON.stringify(data));showToast('Progres tersimpan di browser ini.');}
    catch(e){showToast('Penyimpanan tidak tersedia di browser ini.');}
  }
  function loadGame() {
    try {
      const raw=localStorage.getItem('jejakNurSaveV5');if(!raw)return;
      const d=JSON.parse(raw);
      if(Number.isFinite(d.x)&&Number.isFinite(d.y)){player.x=clamp(d.x, TILE, WORLD_W-TILE);player.y=clamp(d.y,TILE,WORLD_H-TILE);}
      if(Number.isFinite(d.coins))coins=d.coins;
      if(Array.isArray(d.inventory))inventory=d.inventory;
      if(Number.isFinite(d.gameMinutes))gameMinutes=d.gameMinutes;
      if(Number.isFinite(d.day))day=d.day;
      deliveredQuest=!!d.deliveredQuest;questStage=Number.isInteger(d.questStage)?clamp(d.questStage,0,3):(deliveredQuest?3:0);
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
      if(!collides(x,y,6,n)){n.tx=x;n.ty=y;n.wait=.5+rand(x,y,3)*1.8;return;}
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
      if(!collides(n.x+vx,n.y,6,n))n.x+=vx;if(!collides(n.x,n.y+vy,6,n))n.y+=vy;
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
    if(scene==='world'){camera.x=clamp(player.x-VIEW_W/(2*ZOOM),0,WORLD_W-VIEW_W/ZOOM);camera.y=clamp(player.y-VIEW_H/(2*ZOOM),0,WORLD_H-VIEW_H/ZOOM);}else{camera.x=0;camera.y=0;}
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
  showToast('Selamat datang di Nuraya! Temui Yusuf untuk memulai misi pertamamu.',4);
  requestAnimationFrame(frame);
})();
