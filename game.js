(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const $ = id => document.getElementById(id);
  const keys = new Set();
  let running = false, last = 0, cameraX = 0, toastTimer = 0;
  let player, enemies, coins, particles, score, coinCount, bossMode, bossDefeated, gameTime;
  const groundY = 438;
  const worldWidth = 3000;

  function resetGame() {
    player = {x:100,y:groundY-56,w:36,h:56,vx:0,vy:0,hp:100,maxHp:100,mp:50,maxMp:50,
      exp:0,nextExp:100,level:1,face:1,onGround:true,attack:0,skill:0,invuln:0,flash:0};
    enemies = []; coins = []; particles = []; score = 0; coinCount = 0; bossMode = false;
    bossDefeated = false; gameTime = 0; cameraX = 0;
    for (let i=0;i<12;i++) spawnEnemy(360+i*205, i%4===0?'golem':'slime');
    for (let i=0;i<24;i++) coins.push({x:260+i*105,y:groundY-25-(i%3)*20,r:8,got:false});
    updateHud();
  }
  function spawnEnemy(x,type) {
    const boss = type === 'boss';
    enemies.push({x,y:groundY-(boss?100:boss?100:46),w:boss?86:type==='golem'?54:42,h:boss?100:type==='golem'?58:46,
      type,hp:boss?450:type==='golem'?90:45,maxHp:boss?450:type==='golem'?90:45,speed:boss?1.1:type==='golem'?.55:1.0,
      dir:Math.random()<.5?-1:1,phase:Math.random()*6,hit:0,alive:true,attackCd:0});
  }
  function startGame() {
    const pass = $('passwordInput').value.trim();
    if (pass !== 'maple') { $('loginError').textContent = '암호가 올바르지 않습니다. 기본 암호는 maple입니다.'; return; }
    $('loginError').textContent = '';
    const name = $('nameInput').value.trim() || '모험가';
    $('playerName').textContent = name;
    $('startOverlay').classList.add('hidden');
    $('gameOverOverlay').classList.add('hidden');
    resetGame(); running = true; last = performance.now(); requestAnimationFrame(loop);
    showToast(`${name}님, 모험을 시작합니다!`);
  }
  function endGame(win) {
    running = false;
    $('endTitle').textContent = win ? '보스 처치 성공!' : '모험 종료';
    $('endMessage').textContent = win ? `최종 레벨 ${player.level} · ${score} 포인트 · ${coinCount} 코인` : `레벨 ${player.level} · ${score} 포인트를 획득했어요. 다시 도전해 보세요.`;
    $('gameOverOverlay').classList.remove('hidden');
  }
  function showToast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
  }
  function updateHud() {
    $('levelText').textContent = `Lv. ${player.level}`;
    $('hpText').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    $('mpText').textContent = `${Math.ceil(player.mp)} / ${player.maxMp}`;
    $('expText').textContent = `${player.exp} / ${player.nextExp}`;
    $('hpBar').style.width = `${100*player.hp/player.maxHp}%`;
    $('mpBar').style.width = `${100*player.mp/player.maxMp}%`;
    $('expBar').style.width = `${100*player.exp/player.nextExp}%`;
    $('coinText').textContent = coinCount;
    $('scoreText').textContent = score;
    $('mapText').textContent = bossMode ? '보스룸' : '초보자 사냥터';
  }
  function attack(skill=false) {
    if (!running) return;
    if (skill) {
      if (player.mp < 10 || player.skill > 0) { if(player.mp<10) showToast('MP가 부족합니다!'); return; }
      player.mp -= 10; player.skill = 24; player.attack = 14;
      burst(player.x+player.w/2+player.face*42,player.y+22,'#7ce8ff',18);
    } else {
      if (player.attack > 0) return;
      player.attack = 13;
    }
    const range = skill ? 150 : 75;
    let hits = 0;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x+e.w/2-(player.x+player.w/2);
      const dy = Math.abs((e.y+e.h/2)-(player.y+player.h/2));
      if (Math.abs(dx) < range && dy < 95 && (skill || Math.sign(dx||1)===player.face)) {
        e.hp -= skill ? 42+player.level*5 : 22+player.level*4; e.hit=10; hits++;
        burst(e.x+e.w/2,e.y+e.h/2,skill?'#80efff':'#ffe58b',skill?9:5);
        if(e.hp<=0){e.alive=false; score+=e.type==='boss'?500: e.type==='golem'?30:15; coinCount+=e.type==='boss'?20:1; gainExp(e.type==='boss'?100: e.type==='golem'?35:20);}
      }
    }
    if (hits) showToast(skill ? `스킬 적중! ${hits}마리` : `공격 적중! ${hits}마리`);
    updateHud();
  }
  function gainExp(n) {
    player.exp += n;
    while(player.exp >= player.nextExp) {
      player.exp -= player.nextExp; player.level++; player.nextExp=Math.floor(player.nextExp*1.35);
      player.maxHp+=15; player.hp=player.maxHp; player.maxMp+=8; player.mp=player.maxMp;
      showToast(`레벨 업! Lv. ${player.level}`);
      burst(player.x+18,player.y+20,'#ffe77b',22);
    }
  }
  function burst(x,y,color,n) {
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*4;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:20+Math.random()*15,color});}
  }
  function enterBoss() {
    if (bossMode || score < 120) { if(!bossMode) showToast('포인트 120 이상 모으면 ↓ 로 보스룸 입장!'); return; }
    bossMode=true; enemies=[]; coins=[];
    spawnEnemy(cameraX+W+100,'boss');
    player.x=cameraX+90; player.hp=Math.min(player.maxHp,player.hp+25);
    showToast('보스룸에 입장했습니다! 보스를 처치하세요.');
    updateHud();
  }
  function loop(now) {
    if(!running) return;
    const dt=Math.min((now-last)/16.67,2.2); last=now; gameTime+=dt;
    update(dt); draw(); requestAnimationFrame(loop);
  }
  function update(dt) {
    const accel=0.72*dt;
    if(keys.has('ArrowLeft')||keys.has('KeyA')){player.vx-=accel;player.face=-1;}
    else if(keys.has('ArrowRight')||keys.has('KeyD')){player.vx+=accel;player.face=1;}
    else player.vx*=Math.pow(.78,dt);
    player.vx=Math.max(-4.5,Math.min(4.5,player.vx));
    if((keys.has('ArrowUp')||keys.has('Space')||keys.has('KeyW'))&&player.onGround){player.vy=-11.2;player.onGround=false;}
    player.x+=player.vx*dt; player.x=Math.max(0,Math.min(worldWidth-player.w,player.x));
    player.vy+=.58*dt; player.y+=player.vy*dt;
    if(player.y+player.h>=groundY){player.y=groundY-player.h;player.vy=0;player.onGround=true;}
    if(player.attack>0)player.attack-=dt;if(player.skill>0)player.skill-=dt;if(player.invuln>0)player.invuln-=dt;
    if(!bossMode) player.mp=Math.min(player.maxMp,player.mp+.012*dt);
    cameraX=Math.max(0,Math.min(worldWidth-W,player.x-W*.37));
    for(const e of enemies){
      if(!e.alive)continue;
      e.phase+=.04*dt;if(e.hit>0)e.hit-=dt;if(e.attackCd>0)e.attackCd-=dt;
      const dx=(player.x+player.w/2)-(e.x+e.w/2);
      if(e.type==='boss'){
        e.x += Math.sign(dx)*e.speed*dt*.65;
        e.x=Math.max(cameraX+20,Math.min(cameraX+W-e.w-20,e.x));
        if(Math.abs(dx)<100 && e.attackCd<=0){player.hp-=12;player.invuln=35;e.attackCd=65;burst(player.x+18,player.y+25,'#ff7894',10);showToast('보스의 강력한 공격!');}
      }else{
        e.x+=e.dir*e.speed*dt;
        if(Math.random()<.012*dt)e.dir*=-1;
        if(Math.abs(dx)<95)e.dir=Math.sign(dx||1);
        e.x=Math.max(0,Math.min(worldWidth-e.w,e.x));
        if(Math.abs(dx)<28 && Math.abs(player.y-e.y)<60 && player.invuln<=0 && e.attackCd<=0){
          player.hp-=e.type==='golem'?9:5;player.invuln=38;e.attackCd=45;player.vx=-Math.sign(dx)*3;player.vy=-3;
          burst(player.x+18,player.y+20,'#ff718b',7);
        }
      }
      if(e.hp<=0&&!e.alive&&e.type==='boss'){bossDefeated=true;}
    }
    for(const c of coins){if(c.got)continue;if(Math.abs((player.x+18)-c.x)<28&&Math.abs((player.y+25)-c.y)<45){c.got=true;coinCount++;score+=2;burst(c.x,c.y,'#ffe477',5);}}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.1*dt;p.life-=dt;}
    particles=particles.filter(p=>p.life>0);
    if(player.hp<=0){player.hp=0;updateHud();endGame(false);return;}
    if(bossMode && enemies.every(e=>!e.alive)){endGame(true);return;}
    updateHud();
  }
  function roundedRect(x,y,w,h,r,fill,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  }
  function draw() {
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,bossMode?'#241c4c':'#5d9ed1');sky.addColorStop(1,bossMode?'#5c2d69':'#d6efff');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // distant hills and clouds
    for(let i=0;i<7;i++){const x=((i*210-cameraX*.18)%(W+250)+W+250)%(W+250)-100;ctx.fillStyle=bossMode?'#30284f':'#8cc5d9';ctx.beginPath();ctx.ellipse(x,330,145,90,0,Math.PI,0);ctx.fill();}
    if(!bossMode){
      for(let i=0;i<5;i++){const x=((i*260-cameraX*.32)%(W+200)+W+200)%(W+200)-70;ctx.fillStyle='#f4fbff88';ctx.beginPath();ctx.ellipse(x,90+(i%3)*45,35,12,0,0,Math.PI*2);ctx.ellipse(x+20,85+(i%3)*45,26,18,0,0,Math.PI*2);ctx.fill();}
    } else {
      for(let i=0;i<12;i++){ctx.fillStyle='#ff74c533';ctx.beginPath();ctx.arc((i*89+gameTime*1.8)%W,(i*53+gameTime*2.3)%H,2+(i%3),0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#ffe1ff';ctx.font='bold 22px sans-serif';ctx.fillText('BOSS ROOM',W/2-65,48);
    }
    // ground
    ctx.fillStyle=bossMode?'#382c47':'#4e9460';ctx.fillRect(0,groundY,W,H-groundY);
    ctx.fillStyle=bossMode?'#62415e':'#78c86f';ctx.fillRect(0,groundY,W,10);
    for(let x=-(cameraX%42);x<W;x+=42){ctx.fillStyle=bossMode?'#51354e':'#639f58';ctx.fillRect(x,groundY+10,21,8);ctx.fillStyle='#00000012';ctx.fillRect(x+21,groundY+30,21,9);}
    if(!bossMode){
      // simple trees and signs
      for(let i=0;i<14;i++){const wx=i*245+30,x=wx-cameraX;if(x<-80||x>W+80)continue;ctx.fillStyle='#74513e';ctx.fillRect(x+20,groundY-68,12,68);ctx.fillStyle='#2f855b';ctx.beginPath();ctx.arc(x+26,groundY-80,32,0,Math.PI*2);ctx.fill();ctx.fillStyle='#54b878';ctx.beginPath();ctx.arc(x+12,groundY-91,20,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff7ce';ctx.font='bold 13px sans-serif';ctx.fillText('초보자 사냥터',22,28);
    }
    // coins
    for(const c of coins){if(c.got)continue;const x=c.x-cameraX;if(x<-20||x>W+20)continue;ctx.save();ctx.translate(x,c.y+Math.sin(gameTime*.08+c.x)*3);ctx.fillStyle='#ffdc58';ctx.beginPath();ctx.ellipse(0,0,7,10,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff2a2';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    // enemies
    for(const e of enemies){if(!e.alive)continue;const x=e.x-cameraX;if(x<-150||x>W+150)continue;drawEnemy(e,x);}
    drawPlayer(player.x-cameraX,player.y);
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/30);ctx.fillStyle=p.color;ctx.fillRect(p.x-cameraX,p.y,4,4);ctx.globalAlpha=1;}
    // hints
    ctx.fillStyle='#12233bbd';roundedRect(W-265,14,248,36,9,'#12233bcc','#ffffff28');
    ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText(bossMode?'보스를 공격해 처치하세요!':`포인트 ${score} / 보스 입장 120 P`,W-251,37);
  }
  function drawPlayer(x,y) {
    const p=player;ctx.save();
    if(p.invuln>0&&Math.floor(gameTime/3)%2===0)ctx.globalAlpha=.45;
    // shadow
    ctx.fillStyle='#15253b44';ctx.beginPath();ctx.ellipse(x+p.w/2,groundY+2,23,5,0,0,Math.PI*2);ctx.fill();
    // cape
    ctx.fillStyle='#e85b72';ctx.beginPath();ctx.moveTo(x+9,y+20);ctx.lineTo(x+2,y+45);ctx.lineTo(x+16,y+40);ctx.lineTo(x+23,y+23);ctx.fill();
    // legs
    ctx.fillStyle='#26385d';roundedRect(x+7,y+39,9,17,3,'#26385d');roundedRect(x+21,y+39,9,17,3,'#26385d');
    ctx.fillStyle='#d8e8ff';roundedRect(x+5,y+51,13,5,2,'#d8e8ff');roundedRect(x+20,y+51,13,5,2,'#d8e8ff');
    // body and head
    roundedRect(x+5,y+19,27,24,7,'#4b86dc','#263e70');ctx.fillStyle='#f5c7a4';ctx.beginPath();ctx.arc(x+18,y+13,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5b382d';ctx.beginPath();ctx.arc(x+17,y+8,12,Math.PI,Math.PI*2);ctx.lineTo(x+29,y+14);ctx.lineTo(x+23,y+10);ctx.fill();
    ctx.fillStyle='#18243b';ctx.fillRect(x+(p.face>0?21:10),y+13,3,3);
    // sword swing
    if(p.attack>0){ctx.save();ctx.translate(x+18,y+27);ctx.scale(p.face,1);ctx.strokeStyle=p.skill>0?'#7deeff':'#fff0a1';ctx.lineWidth=p.skill>0?7:5;ctx.beginPath();ctx.arc(12,0,35,-1.05,.9);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(12,0,35,-1.05,.9);ctx.stroke();ctx.restore();}
    if(p.skill>0){ctx.strokeStyle='#8df4ff88';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+18,y+28,55+Math.sin(gameTime)*5,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawEnemy(e,x) {
    const y=e.y;
    if(e.type==='boss'){
      // stylized horned boss
      ctx.fillStyle='#30223f';ctx.beginPath();ctx.moveTo(x+15,y+28);ctx.lineTo(x+2,y-8);ctx.lineTo(x+32,y+10);ctx.fill();ctx.beginPath();ctx.moveTo(x+e.w-15,y+28);ctx.lineTo(x+e.w-2,y-8);ctx.lineTo(x+e.w-32,y+10);ctx.fill();
      roundedRect(x+6,y+17,e.w-12,e.h-17,22,e.hit>0?'#f9d5ff':'#8c4cb1','#4a2d69');
      ctx.fillStyle='#ffdf79';ctx.fillRect(x+22,y+43,12,7);ctx.fillRect(x+e.w-34,y+43,12,7);
      ctx.fillStyle='#ff8eaa';ctx.fillRect(x+29,y+45,4,3);ctx.fillRect(x+e.w-29,y+45,4,3);
      ctx.fillStyle='#2c1e3b';ctx.fillRect(x+18,y+75,e.w-36,5);
      ctx.fillStyle='#1c1830';ctx.fillRect(x+15,y-13,e.w-30,5);ctx.fillStyle='#ff5f8b';ctx.fillRect(x+15,y-13,(e.w-30)*Math.max(0,e.hp/e.maxHp),5);
      ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.fillText('발록 · BOSS',x+10,y-20);
    } else if(e.type==='golem'){
      roundedRect(x,y+7,e.w,e.h-7,11,e.hit>0?'#fff0c9':'#7c8b9f','#4d5d76');
      ctx.fillStyle='#aebaca';ctx.fillRect(x+8,y+1,14,14);ctx.fillRect(x+31,y-3,15,15);
      ctx.fillStyle='#ffeb94';ctx.fillRect(x+12,y+23,7,5);ctx.fillRect(x+e.w-19,y+23,7,5);
      ctx.fillStyle='#46556a';ctx.fillRect(x+9,y+36,e.w-18,5);
      ctx.fillStyle='#1a2b43';ctx.fillRect(x+4,y-5,e.w-8,4);ctx.fillStyle='#ff7792';ctx.fillRect(x+4,y-5,(e.w-8)*Math.max(0,e.hp/e.maxHp),4);
    } else {
      ctx.fillStyle=e.hit>0?'#fff2cf':'#6bd8a1';ctx.beginPath();ctx.ellipse(x+e.w/2,y+e.h/2+4,e.w/2,e.h/2-2,0,Math.PI,Math.PI*2);ctx.lineTo(x+e.w,y+e.h-5);ctx.quadraticCurveTo(x+e.w/2,y+e.h+8,x,y+e.h-5);ctx.closePath();ctx.fill();ctx.strokeStyle='#358d76';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='#183e50';ctx.fillRect(x+10,y+18,4,7);ctx.fillRect(x+e.w-14,y+18,4,7);ctx.fillStyle='#fff';ctx.fillRect(x+11,y+18,2,2);ctx.fillRect(x+e.w-13,y+18,2,2);
      ctx.fillStyle='#1a2b43';ctx.fillRect(x+4,y-5,e.w-8,4);ctx.fillStyle='#ff7792';ctx.fillRect(x+4,y-5,(e.w-8)*Math.max(0,e.hp/e.maxHp),4);
    }
  }

  window.addEventListener('keydown',e=>{
    const handled=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyZ','KeyX'];
    if(handled.includes(e.code))e.preventDefault();
    keys.add(e.code);
    if(e.repeat)return;
    if(e.code==='KeyZ')attack(false);
    if(e.code==='KeyX')attack(true);
    if(e.code==='ArrowDown')enterBoss();
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>keys.clear());
  document.querySelectorAll('[data-key]').forEach(btn=>{
    const key=btn.dataset.key;
    const down=e=>{e.preventDefault();keys.add(key);};
    const up=e=>{e.preventDefault();keys.delete(key);};
    btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);
    btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up);
  });
  document.querySelector('[data-action="attack"]').addEventListener('click',()=>attack(false));
  document.querySelector('[data-action="skill"]').addEventListener('click',()=>attack(true));
  $('startButton').addEventListener('click',startGame);
  $('restartButton').addEventListener('click',()=>{ $('gameOverOverlay').classList.add('hidden');resetGame();running=true;last=performance.now();requestAnimationFrame(loop);});
  $('passwordInput').addEventListener('keydown',e=>{if(e.key==='Enter')startGame();});
  // Draw an attractive title-screen background before starting.
  resetGame(); draw();
})();