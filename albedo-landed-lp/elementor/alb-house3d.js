/*
 * Albedo Design – scroll-driven 3D house for the "why us" section (04-why-us.html).
 * Illustrative model only (not an Albedo project). Requires three.js r149 (UMD build),
 * which is lazy-loaded from the section's data-three-src when the section nears the viewport.
 * Without IntersectionObserver or WebGL the section keeps its static illustration.
 */
(function () {
  "use strict";

  function albBuildHouse(THREE, canvas, opts) {
    opts = opts || {};
    var accent = opts.accent || '#ED5930';
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

    var hemi = new THREE.HemisphereLight(0xffffff, 0xc9d3de, 0.75); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff3e2, 1.15);
    sun.position.set(-14, 24, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18; sun.shadow.camera.right = 18; sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    function C(c) { return new THREE.Color(c); }
    function mat(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0 }, o || {})); }
    var M = {
      ground: mat('#E6ECF1'), grass: mat('#B9C9B4'), slab: mat('#F4F1EC'), wall: mat('#FBFAF8'), wallEdge: mat('#E7E2DA'),
      timber: mat('#B07A4F', { roughness: 0.6 }), timberDark: mat('#6E4A31', { roughness: 0.6 }), fabric: mat('#E8E1D6'),
      navy: mat('#00325D', { roughness: 0.7 }), accent: mat(accent, { roughness: 0.7 }), stone: mat('#DCD7CF', { roughness: 0.35 }),
      dark: mat('#2B3440', { roughness: 0.5 }), rug: mat('#C9B9A3'), white: mat('#FFFFFF'), plant: mat('#6F8F6A'), leaf: mat('#7E9A78'),
      sage: mat('#A9B8A3'), roof: mat('#3D4752', { roughness: 0.7, side: THREE.DoubleSide }), paving: mat('#D5D1CA'), metal: mat('#5B6673', { roughness: 0.4, metalness: 0.4 }),
      lamp: mat('#FFE2B8', { emissive: '#FFC27A', emissiveIntensity: 0 }), art: mat('#4F7CA7'),
      glass: new THREE.MeshStandardMaterial({ color: '#D3E6F4', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0, depthWrite: false }),
      line: new THREE.LineBasicMaterial({ color: '#00325D', transparent: true, opacity: 0.55 })
    };

    var W = 7, D = 15, H = 3.2, T = 0.18, hx = W / 2, hz = D / 2;
    var y1 = 0.2 + H, fy = y1 + 0.2, z1a = -hz, z1b = 4.8;   // upper floor spans z -7.5 .. 4.8
    var root = new THREE.Group(); scene.add(root);

    function box(w, h, d, m, x, y, z, parent, noShadow) {
      var g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
      var mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z);
      mesh.castShadow = !noShadow; mesh.receiveShadow = true;
      (parent || root).add(mesh); return mesh;
    }
    function sphere(r, m, x, y, z, parent) {
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m); mesh.position.set(x, y, z); mesh.castShadow = true; (parent || root).add(mesh); return mesh;
    }
    function cyl(r, h, m, x, y, z, parent) {
      var g = new THREE.CylinderGeometry(r, r, h, 18); g.translate(0, h / 2, 0);
      var mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.castShadow = true; (parent || root).add(mesh); return mesh;
    }

    // site
    // No floor or sky: a transparent ground that only receives a soft shadow.
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: 0.16 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    // ---------- stage 1: floor plan ----------
    var slab0 = box(W, 0.2, D, M.slab, 0, 0, 0);
    var pts = [];
    function seg(x1, z1, x2, z2) { pts.push(new THREE.Vector3(x1, 0.22, z1), new THREE.Vector3(x2, 0.22, z2)); }
    seg(-hx, -hz, hx, -hz); seg(hx, -hz, hx, hz); seg(hx, hz, -hx, hz); seg(-hx, hz, -hx, -hz);
    seg(-hx, -1.5, 1.2, -1.5); seg(1.2, -1.5, 1.2, -hz); seg(-hx, 3.2, hx, 3.2); seg(2, 3.2, 2, hz);
    var planLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), M.line); root.add(planLines);

    // ---------- stage 2: ground floor walls + stairs ----------
    var walls0 = [], rightWalls = [];
    walls0.push(box(T, H, D, M.wall, -hx + T / 2, 0.2, 0));
    var rw0 = box(T, H, D, M.wall, hx - T / 2, 0.2, 0); rightWalls.push(rw0); walls0.push(rw0);
    walls0.push(box(W, H, T, M.wall, 0, 0.2, -hz + T / 2));
    walls0.push(box(T, H, 6, M.wallEdge, 1.2, 0.2, -hz + 3));
    walls0.push(box(2.2, H, T, M.wallEdge, hx - 1.1, 0.2, 3.2));
    var stairs = [];
    for (var s = 0; s < 14; s++) stairs.push(box(1.0, 0.23 * (s + 1), 0.28, M.timber, hx - 0.7, 0.2, -1.2 + s * 0.28));

    // ---------- stage 3: upper level ----------
    var slab1 = box(W, 0.2, z1b - z1a, M.slab, 0, y1, (z1a + z1b) / 2);
    var walls1 = [];
    walls1.push(box(T, H, z1b - z1a, M.wall, -hx + T / 2, fy, (z1a + z1b) / 2));
    var rw1 = box(T, H, z1b - z1a, M.wall, hx - T / 2, fy, (z1a + z1b) / 2); rightWalls.push(rw1); walls1.push(rw1);
    walls1.push(box(W, H, T, M.wall, 0, fy, -hz + T / 2));
    walls1.push(box(W, H, T, M.wallEdge, 0, fy, -0.6));
    walls1.push(box(T, H, 3.4, M.wallEdge, 0.6, fy, -4.3));   // bathroom partition

    // ---------- stage 4: interior design ----------
    var furn = [];
    function f(mesh) { furn.push(mesh); return mesh; }
    // living (GF front)
    f(box(3.4, 0.03, 2.6, M.rug, -0.6, 0.2, 5.0));
    f(box(2.8, 0.42, 0.95, M.navy, -0.8, 0.2, 6.4)); f(box(2.8, 0.42, 0.22, M.navy, -0.8, 0.62, 6.8));
    f(box(0.95, 0.42, 1.6, M.navy, 0.95, 0.2, 5.6));                       // L-sofa
    f(box(0.5, 0.32, 0.16, M.accent, -1.7, 0.62, 6.45)); f(box(0.5, 0.32, 0.16, M.fabric, -0.2, 0.62, 6.45));
    f(cyl(0.55, 0.36, M.timber, -0.8, 0.2, 5.0));                           // round coffee table
    f(box(3.6, 2.4, 0.3, M.timber, -1.2, 0.2, 3.45));                       // timber feature wall
    f(box(2.0, 1.15, 0.05, M.dark, -1.2, 1.0, 3.62));                       // TV
    f(box(2.6, 0.4, 0.45, M.white, -1.2, 0.2, 3.8));                        // floating console
    f(cyl(0.28, 0.5, M.stone, 2.4, 0.2, 6.7)); f(sphere(0.55, M.plant, 2.4, 1.15, 6.7));
    f(cyl(0.02, 1.4, M.metal, 1.6, 0.2, 4.3)); f(sphere(0.2, M.lamp, 1.6, 1.65, 4.3));   // floor lamp
    // dining (GF middle)
    f(box(2.2, 0.06, 1.0, M.timber, -1.0, 0.95, 0.9));
    f(box(0.1, 0.75, 0.8, M.timberDark, -1.9, 0.2, 0.9)); f(box(0.1, 0.75, 0.8, M.timberDark, -0.1, 0.2, 0.9));
    [-1.7, -1.0, -0.3].forEach(function (x) { f(box(0.42, 0.45, 0.42, M.fabric, x, 0.2, 0.05)); f(box(0.42, 0.45, 0.42, M.fabric, x, 0.2, 1.75)); });
    [-1.5, -0.5].forEach(function (x) { f(cyl(0.02, 0.9, M.metal, x, 2.5, 0.9)); f(sphere(0.18, M.lamp, x, 2.45, 0.9)); });
    f(box(0.06, 0.9, 1.4, M.art, -hx + 0.22, 1.4, 0.9));                     // artwork
    // kitchen (GF back)
    f(box(2.4, 0.92, 0.95, M.stone, -1.1, 0.2, -3.7));
    f(box(W - 0.4, 0.92, 0.65, M.white, -0.2, 0.2, -hz + 0.55));
    f(box(W - 0.4, 0.75, 0.38, M.timber, -0.2, 1.8, -hz + 0.4));
    f(box(0.7, 2.2, 0.7, M.white, hx - 0.6, 0.2, -hz + 1.6));                // fridge tower
    [-1.6, -0.6].forEach(function (x) { f(cyl(0.02, 0.8, M.metal, x, 2.6, -3.7)); f(sphere(0.14, M.lamp, x, 2.55, -3.7)); });
    // upper: master bedroom (front)
    f(box(2.4, 0.03, 1.8, M.rug, -1.2, fy, 2.7));
    f(box(2.0, 0.45, 2.2, M.fabric, -1.2, fy, 2.6)); f(box(2.4, 1.0, 0.12, M.timber, -1.2, fy, 1.45));
    f(box(1.9, 0.06, 0.8, M.navy, -1.2, fy + 0.45, 3.2)); f(box(0.6, 0.18, 0.35, M.white, -1.7, fy + 0.45, 1.8)); f(box(0.6, 0.18, 0.35, M.white, -0.7, fy + 0.45, 1.8));
    f(box(0.45, 0.5, 0.45, M.timberDark, 0.25, fy, 1.7)); f(sphere(0.15, M.lamp, 0.25, fy + 0.7, 1.7));
    f(box(0.6, 2.4, 2.6, M.timber, hx - 0.55, fy, 2.4));                     // wardrobe
    f(box(1.2, 0.75, 0.6, M.timber, 1.6, fy, 0.2)); f(box(0.45, 0.45, 0.45, M.accent, 1.6, fy, 0.75));  // study desk + chair
    // upper: second bedroom + bathroom (back)
    f(box(1.6, 0.45, 2.0, M.fabric, -1.9, fy, -3.0)); f(box(1.6, 0.85, 0.12, M.sage, -1.9, fy, -4.05)); f(box(1.5, 0.06, 0.7, M.sage, -1.9, fy + 0.45, -2.5));
    f(box(1.2, 0.85, 0.5, M.stone, 2.2, fy, -hz + 0.5)); f(box(1.0, 0.7, 0.04, M.white, 2.2, fy + 1.1, -hz + 0.25));  // vanity + mirror
    f(box(0.9, 2.0, 0.04, M.glass, 1.3, fy, -5.2, null, true));                // shower glass
    furn.forEach(function (m) { m.visible = false; });
    var lights = [];
    [[-0.6, 2.6, 5.2], [-1.0, 2.5, 0.9], [-1.0, 2.6, -3.7], [-1.2, y1 + 2.8, 2.6], [-1.6, y1 + 2.8, -3.0]].forEach(function (pp) {
      var L = new THREE.PointLight(0xffc98a, 0, 9, 2); L.position.set(pp[0], pp[1], pp[2]); scene.add(L); lights.push(L);
    });

    // ---------- stage 5: complete house ----------
    var ext = [];
    function e(mesh) { ext.push(mesh); mesh.userData.base = mesh.position.clone(); mesh.visible = false; return mesh; }
    // front facade: ground-floor glazing + frame
    var gGlassF = e(box(W - 0.4, H - 0.4, 0.06, M.glass, 0, 0.2, hz - 0.05, null, true));
    e(box(W, 0.4, 0.3, M.wall, 0, 0.2 + H - 0.4, hz - 0.15));
    [-1.2, 1.2].forEach(function (x) { e(box(0.06, H - 0.4, 0.1, M.dark, x, 0.2, hz - 0.02)); });
    // flat roof over ground-floor front (doubles as balcony)
    e(box(W, 0.25, hz - z1b, M.wall, 0, y1, (hz + z1b) / 2));
    e(box(W, 1.0, 0.06, M.glass, 0, y1 + 0.25, hz - 0.08, null, true));      // balcony glass rail
    // upper facade: glazing + timber fins
    var uGlass = e(box(W - 0.4, H - 0.5, 0.06, M.glass, 0, fy, z1b - 0.05, null, true));
    e(box(W, 0.5, 0.3, M.wall, 0, fy + H - 0.5, z1b - 0.15));
    for (var k = 0; k < 9; k++) e(box(0.08, H - 0.5, 0.35, M.timber, 0.9 + k * 0.28, fy, z1b + 0.12));
    // pitched roof with gables
    var rw = hx + 0.45, cz = (z1a + z1b) / 2, rd = (z1b - z1a) / 2 + 0.45, rh = 2.3;
    var rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute([
      -rw, 0, -rd, -rw, 0, rd, 0, rh, rd,  -rw, 0, -rd, 0, rh, rd, 0, rh, -rd,
      rw, 0, -rd, 0, rh, -rd, 0, rh, rd,  rw, 0, -rd, 0, rh, rd, rw, 0, rd
    ], 3));
    rg.computeVertexNormals();
    var roof = new THREE.Mesh(rg, M.roof); roof.castShadow = true; roof.position.set(0, fy + H, cz); root.add(roof); e(roof);
    var gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute([-hx, 0, 0, hx, 0, 0, 0, rh * (hx / rw), 0], 3)); gg.computeVertexNormals();
    var gMat = M.wall.clone(); gMat.side = THREE.DoubleSide;
    var gf = new THREE.Mesh(gg, gMat); gf.position.set(0, fy + H, z1b - 0.05); root.add(gf); e(gf);
    var gb = new THREE.Mesh(gg, gMat); gb.position.set(0, fy + H, z1a + 0.05); root.add(gb); e(gb);
    // front yard: porch, car, gate, trees
    e(box(W, 0.06, 3.0, M.paving, 0, 0.01, hz + 1.5, null, true));
    e(box(0.9, 0.45, 0.9, M.stone, 2.4, 0.01, hz + 2.4)); e(sphere(0.5, M.plant, 2.4, 0.85, hz + 2.4));
    for (var g2 = 0; g2 < 16; g2++) e(box(0.05, 0.95, 0.05, M.dark, -hx + 0.25 + g2 * 0.45, 0.01, hz + 3.4));
    e(box(W + 0.2, 0.06, 0.08, M.dark, 0, 0.95, hz + 3.4));
    e(cyl(0.12, 1.8, M.timberDark, -hx - 0.9, 0.01, hz + 1.5)); e(sphere(1.1, M.leaf, -hx - 0.9, 2.6, hz + 1.5));
    e(cyl(0.12, 1.6, M.timberDark, hx + 1.0, 0.01, -2)); e(sphere(1.0, M.leaf, hx + 1.0, 2.3, -2));
    e(box(1.6, 0.5, 0.5, M.stone, -1.9, 0.01, hz + 0.5)); e(sphere(0.45, M.plant, -2.3, 0.7, hz + 0.5)); e(sphere(0.4, M.plant, -1.5, 0.65, hz + 0.5));

    var slabCol0 = C('#F4F1EC'), slabCol1 = C('#C9A27E');
    var groundDay = C('#E6ECF1'), groundDusk = C('#DCE2EA'), sky0 = C('#FFFFFF'), sky1 = C('#C7D3E2');

    function clamp(x) { return Math.max(0, Math.min(1, x)); }
    function seg01(p, a, b) { return clamp((p - a) / (b - a)); }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function grow(m, t) { m.visible = t > 0.001; m.scale.y = Math.max(0.001, t); }

    var target = 0, cur = 0;
    function resize() {
      var r = canvas.getBoundingClientRect(); var w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }

    function apply(p) {
      // 1 plan (0 – 0.2)
      planLines.material.opacity = 0.6 * (1 - seg01(p, 0.28, 0.4));
      // 2 ground floor walls (0.14 – 0.36)
      var tw = ease(seg01(p, 0.14, 0.34));
      walls0.forEach(function (m) { grow(m, tw); });
      stairs.forEach(function (m, i) { grow(m, ease(seg01(p, 0.2 + i * 0.008, 0.33 + i * 0.008))); });
      // 3 upper level (0.38 – 0.58)
      var ts = ease(seg01(p, 0.38, 0.47));
      slab1.visible = ts > 0.001; slab1.position.y = y1 + (1 - ts) * 6;
      var tw1 = ease(seg01(p, 0.44, 0.57));
      walls1.forEach(function (m) { grow(m, tw1); });
      // right party walls stay low (cutaway) until the house closes
      var tc = ease(seg01(p, 0.8, 0.9));
      rightWalls.forEach(function (m) { if (m.visible) m.scale.y = Math.max(0.001, (m === rw0 ? tw : tw1) * (0.42 + 0.58 * tc)); });
      // 4 interior design (0.6 – 0.78)
      var ti = seg01(p, 0.58, 0.66);
      slab0.material.color.copy(slabCol0).lerp(slabCol1, ti);
      furn.forEach(function (m, i) {
        var t = ease(seg01(p, 0.6 + (i % 16) * 0.007, 0.67 + (i % 16) * 0.007));
        m.visible = t > 0.001; m.scale.set(Math.max(0.001, t), Math.max(0.001, t), Math.max(0.001, t));
      });
      var tl = seg01(p, 0.68, 0.78), tdusk = seg01(p, 0.84, 0.98);
      lights.forEach(function (L) { L.intensity = 1.2 * tl + 3.0 * tdusk; });
      M.lamp.emissiveIntensity = 1.2 * tl + 1.6 * tdusk;
      // 5 complete house (0.8 – 0.95)
      ext.forEach(function (m, i) {
        var t = ease(seg01(p, 0.8 + (i % 12) * 0.006, 0.88 + (i % 12) * 0.006));
        m.visible = t > 0.001;
        m.position.y = m.userData.base.y + (1 - t) * 3;
      });
      M.glass.opacity = 0.3 * seg01(p, 0.8, 0.88);
      // dusk
      sun.intensity = 1.15 - 0.35 * tdusk; sun.color.setRGB(1, 0.95 - 0.15 * tdusk, 0.88 - 0.3 * tdusk);
      hemi.intensity = 0.75 - 0.15 * tdusk; hemi.color.copy(sky0).lerp(sky1, tdusk);
      M.ground.color.copy(groundDay).lerp(groundDusk, tdusk);

      // camera: plan view -> orbit inside -> exterior 3/4 front
      var a = ease(seg01(p, 0, 1));
      var theta = -0.7 + a * 1.25;
      var radius = 33 - 5 * ease(seg01(p, 0.4, 0.7)) + 5 * ease(seg01(p, 0.8, 1));
      var elev = 1.3 - 0.68 * ease(seg01(p, 0.05, 0.62)) - 0.32 * ease(seg01(p, 0.8, 1));
      var tgtY = 0.5 + 2.4 * ease(seg01(p, 0.25, 0.6)) + 0.4 * seg01(p, 0.8, 1);
      var tgtZ = 1.8 * ease(seg01(p, 0.8, 1));
      camera.position.set(Math.sin(theta) * Math.cos(elev) * radius, tgtY + Math.sin(elev) * radius, tgtZ + Math.cos(theta) * Math.cos(elev) * radius);
      camera.lookAt(0, tgtY, tgtZ);
    }

    var running = false, raf = 0, reduce = !!opts.reduce;
    function frame() {
      raf = 0;
      cur += (target - cur) * (reduce ? 1 : 0.2);
      if (Math.abs(target - cur) < 0.0005) cur = target;
      apply(cur); renderer.render(scene, camera);
      if (running && cur !== target) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    resize(); apply(0); renderer.render(scene, camera);
    return {
      setProgress: function (p) { target = clamp(p); running = true; kick(); },
      jump: function (p) { target = cur = clamp(p); apply(cur); renderer.render(scene, camera); },
      resize: function () { resize(); apply(cur); renderer.render(scene, camera); },
      dispose: function () { running = false; if (raf) cancelAnimationFrame(raf); renderer.dispose(); }
    };
  }

  // ---------------------------------------------------------------------------
  // Scroll driver: pins the "why us" section and maps scroll progress to the
  // three steps (plan & build → 3D interior → complete home).
  // ---------------------------------------------------------------------------
  var REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
  var threeRequest = null;

  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
  }

  function supportsWebGL() {
    try {
      var probe = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (probe.getContext("webgl2") || probe.getContext("webgl")));
    } catch (error) {
      return false;
    }
  }

  function loadThree(src) {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeRequest) return threeRequest;
    threeRequest = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () { window.THREE ? resolve(window.THREE) : reject(new Error("three.js missing")); };
      script.onerror = function () { reject(new Error("three.js failed to load")); };
      document.head.appendChild(script);
    });
    return threeRequest;
  }

  // Section progress (0–1) → scene progress, so each third of the scroll
  // matches one step: 0–⅓ plan/walls/levels, ⅓–⅔ interior, ⅔–1 complete home.
  function sceneProgress(p) {
    if (p < 1 / 3) return p * 1.5;
    if (p < 2 / 3) return 0.5 + (p - 1 / 3) * 0.9;
    return 0.8 + (p - 2 / 3) * 0.6;
  }

  function initHouse(section) {
    if (!section || section.dataset.albHouseReady === "true") return;
    section.dataset.albHouseReady = "true";

    var canvas = section.querySelector(".alb-house__canvas");
    var figure = section.querySelector(".alb-house");
    var track = section.querySelector(".alb-why__track");
    var badge = section.querySelector(".alb-house__badge");
    var steps = Array.prototype.slice.call(section.querySelectorAll(".alb-why__step"));
    var src = section.getAttribute("data-three-src");
    if (!canvas || !figure || !track || !steps.length || !src) return;
    if (!("IntersectionObserver" in window) || !supportsWebGL()) return;
    // Only enhance when the matching stylesheet is present (e.g. not a stale cached
    // alb-landing.css); otherwise keep the static illustration and list.
    var pin = section.querySelector(".alb-why__pin");
    if (!pin || window.getComputedStyle(pin).display !== "grid") return;

    var house = null;
    var active = -1;
    var ticking = false;
    section.classList.add("is-3d");

    function progress() {
      var rect = track.getBoundingClientRect();
      var span = Math.max(1, track.offsetHeight - window.innerHeight);
      return Math.max(0, Math.min(1, -rect.top / span));
    }

    function setActive(index) {
      if (index === active) return;
      active = index;
      steps.forEach(function (step, i) {
        step.classList.toggle("is-active", i === index);
        step.classList.toggle("is-done", i < index);
        if (i === index) step.setAttribute("aria-current", "step");
        else step.removeAttribute("aria-current");
      });
      if (badge) badge.textContent = steps[index].getAttribute("data-label") || "";
    }

    function update() {
      ticking = false;
      var p = progress();
      setActive(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
      var rect = section.getBoundingClientRect();
      if (house && rect.bottom > -200 && rect.top < window.innerHeight + 200) house.setProgress(sceneProgress(p));
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function build(THREE) {
      try {
        canvas.hidden = false;
        house = albBuildHouse(THREE, canvas, { reduce: prefersReducedMotion() });
        figure.classList.add("is-live");
        house.jump(sceneProgress(progress()));
      } catch (error) {
        canvas.hidden = true;
        figure.classList.remove("is-live");
        house = null;
      }
    }

    // Wait for the page's own load (hero photo, fonts) before the 3D library is
    // requested, then fetch it only once the section is close to the viewport.
    function observeWhenNear() {
      new IntersectionObserver(function (entries, observer) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        observer.disconnect();
        loadThree(src).then(build).catch(function () { /* keep the static illustration */ });
      }, { rootMargin: "35% 0px" }).observe(section);
    }
    if (document.readyState === "complete") observeWhenNear();
    else window.addEventListener("load", observeWhenNear, { once: true });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", function () {
      if (house) house.resize();
      requestUpdate();
    });
    window.addEventListener("pagehide", function () { if (house) house.dispose(); });
    setActive(0);
    update();
  }

  function initAll(root) {
    var scope = root || document;
    var sections = [];
    if (scope.matches && scope.matches("[data-alb-house]")) sections.push(scope);
    if (scope.querySelectorAll) sections = sections.concat(Array.prototype.slice.call(scope.querySelectorAll("[data-alb-house]")));
    sections.forEach(initHouse);
  }

  function initElementor() {
    if (!window.elementorFrontend || !window.elementorFrontend.hooks) return;
    window.elementorFrontend.hooks.addAction("frontend/element_ready/html.default", function ($scope) {
      initAll($scope && $scope[0] ? $scope[0] : document);
    });
  }

  window.AlbedoHouse3D = { initAll: initAll, sceneProgress: sceneProgress };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initAll(document); });
  } else {
    initAll(document);
  }
  window.addEventListener("elementor/frontend/init", initElementor);
})();
