
function RoundEdgedBox(w, h, d, r, wSegs, hSegs, dSegs, rSegs) {
  
    w = w || 1;
    h = h || 1;
    d = d || 1;
    let minimum = Math.min(Math.min(w, h), d);
    r = r || minimum * .25;
    r = r > minimum * .5 ? minimum * .5 : r;
    wSegs = Math.floor(wSegs) || 1;
    hSegs = Math.floor(hSegs) || 1;
    dSegs = Math.floor(dSegs) || 1;
    rSegs = Math.floor(rSegs) || 1;

    let fullGeometry = new THREE.BufferGeometry();

    let fullPosition = [];
    let fullUvs = [];
    let fullIndex = [];
    let fullIndexStart = 0;
    
    let groupStart = 0;

    bendedPlane(w, h, r, wSegs, hSegs, rSegs, d * .5, 'y', 0, 0);
    bendedPlane(w, h, r, wSegs, hSegs, rSegs, d * .5, 'y', Math.PI, 1);
    bendedPlane(d, h, r, dSegs, hSegs, rSegs, w * .5, 'y', Math.PI * .5, 2);
    bendedPlane(d, h, r, dSegs, hSegs, rSegs, w * .5, 'y', Math.PI * -.5, 3);
    bendedPlane(w, d, r, wSegs, dSegs, rSegs, h * .5, 'x', Math.PI * -.5, 4);
    bendedPlane(w, d, r, wSegs, dSegs, rSegs, h * .5, 'x', Math.PI * .5, 5);

    fullGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(fullPosition), 3));
    fullGeometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(fullUvs), 2));
    fullGeometry.setIndex(fullIndex);
    
    fullGeometry.computeVertexNormals();
    
    return fullGeometry;

    function bendedPlane(width, height, radius, widthSegments, heightSegments, smoothness, offset, axis, angle, materialIndex) {

      let halfWidth = width * .5;
      let halfHeight = height * .5;
      let widthChunk = width / (widthSegments + smoothness * 2);
      let heightChunk = height / (heightSegments + smoothness * 2);

      let planeGeom = new THREE.PlaneGeometry(width, height, widthSegments + smoothness * 2, heightSegments + smoothness * 2);

      let v = new THREE.Vector3(); // current vertex
      let cv = new THREE.Vector3(); // control vertex for bending
      let cd = new THREE.Vector3(); // vector for distance
      let position = planeGeom.attributes.position;
      let uv = planeGeom.attributes.uv;
      let widthShrinkLimit = widthChunk * smoothness;
      let widthShrinkRatio = radius / widthShrinkLimit;
      let heightShrinkLimit = heightChunk * smoothness;
      let heightShrinkRatio = radius / heightShrinkLimit;
      let widthInflateRatio = (halfWidth - radius) / (halfWidth - widthShrinkLimit);
      let heightInflateRatio = (halfHeight - radius) / (halfHeight - heightShrinkLimit);
      for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i);
        if (Math.abs(v.x) >= halfWidth - widthShrinkLimit) {
          v.setX((halfWidth - (halfWidth - Math.abs(v.x)) * widthShrinkRatio) * Math.sign(v.x));
        } else {
          v.x *= widthInflateRatio;
        }// lr
        if (Math.abs(v.y) >= halfHeight - heightShrinkLimit) {
          v.setY((halfHeight - (halfHeight - Math.abs(v.y)) * heightShrinkRatio) * Math.sign(v.y));
        } else {
          v.y *= heightInflateRatio;
        }// tb

        //re-calculation of uvs
        uv.setXY(
          i,
          (v.x - (-halfWidth)) / width,
          1 - (halfHeight - v.y) / height
        );


        // bending
        let widthExceeds = Math.abs(v.x) >= halfWidth - radius;
        let heightExceeds = Math.abs(v.y) >= halfHeight - radius;
        if (widthExceeds || heightExceeds) {
          cv.set(
            widthExceeds ? (halfWidth - radius) * Math.sign(v.x) : v.x,
            heightExceeds ? (halfHeight - radius) * Math.sign(v.y) : v.y, -radius);
          cd.subVectors(v, cv).normalize();
          v.copy(cv).addScaledVector(cd, radius);
        };

        position.setXYZ(i, v.x, v.y, v.z);
      }

      planeGeom.translate(0, 0, offset);
      switch (axis) {
        case 'y':
          planeGeom.rotateY(angle);
          break;
        case 'x':
          planeGeom.rotateX(angle);
      }

      // merge positions
      position.array.forEach(function(p){
        fullPosition.push(p);
      });
      
      // merge uvs
      uv.array.forEach(function(u){
        fullUvs.push(u);
      });
      
      // merge indices
      planeGeom.index.array.forEach(function(a) {
        fullIndex.push(a + fullIndexStart);
      });
      fullIndexStart += position.count;
            
      // set the groups
      fullGeometry.addGroup(groupStart, planeGeom.index.count, materialIndex);
      groupStart += planeGeom.index.count;
    }
  }

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( '#40375c' , 1 );
document.body.appendChild( renderer.domElement );

// Walls
const wall1Geometry = new THREE.PlaneGeometry(30, 22.5);
const wall1Material = new THREE.MeshPhongMaterial( { color: '#b08f71', side: THREE.DoubleSide, specular: 'purple' } );                                                 
const wall1 = new THREE.Mesh( wall1Geometry, wall1Material );

const wall2 = new THREE.Mesh( wall1Geometry, wall1Material );

const windoGeometry = new THREE.TorusGeometry( 7, 0.8, 10, 7 ); 
const windoMaterial = new THREE.MeshLambertMaterial( { color: '#544638', side: THREE.DoubleSide } );
const windo = new THREE.Mesh( windoGeometry, windoMaterial );

const outGeometry = new THREE.CircleGeometry( 7, 7 ); 
const outMaterial = new THREE.MeshBasicMaterial( { color: '#40375c', side: THREE.DoubleSide } );
const backout = new THREE.Mesh( outGeometry, outMaterial );

const windSep1Geometry = new THREE.CylinderGeometry(0.35, 0.35, 14, 5);
const windSep1Material = new THREE.MeshLambertMaterial( { color: '#544638', side: THREE.DoubleSide } );
const windSep1 = new THREE.Mesh( windSep1Geometry, windSep1Material );

const windSep2 = new THREE.Mesh( windSep1Geometry, windSep1Material );

scene.add( wall1 );
scene.add( wall2 );
scene.add( windo );
scene.add( backout );
scene.add( windSep1 );
scene.add( windSep2 );

// Floor
const floorGeometry = new THREE.PlaneGeometry(30, 30);
const floorMaterial = new THREE.MeshPhongMaterial( { color: '#80604b', side: THREE.DoubleSide, specular: 'purple' } );
const floor = new THREE.Mesh( floorGeometry, floorMaterial );

scene.add( floor );

// FloorBoards
const floorboardGeometry = new THREE.PlaneGeometry(29, 29);
const floorboardMaterial = new THREE.MeshPhongMaterial( { color: '#957151', side: THREE.DoubleSide, specular: 'purple' } );
const floorboard = new THREE.Mesh( floorboardGeometry, floorboardMaterial );

scene.add(floorboard);

const floorboard2Geometry = new THREE.CircleGeometry( 11, 8 );
const floorboard2Material = new THREE.MeshPhongMaterial( { color: '#434657', side: THREE.DoubleSide, specular: 'purple' } );
const floorboard2 = new THREE.Mesh( floorboard2Geometry, floorboard2Material );

scene.add(floorboard2);

const floorboard3Geometry = new THREE.PlaneGeometry(8, 8);
const floorboard3Material = new THREE.MeshPhongMaterial( { color: '#323240', side: THREE.DoubleSide, specular: 'purple' } );
const floorboard3 = new THREE.Mesh( floorboard3Geometry, floorboard3Material );

scene.add(floorboard3);

// Bed

const plowGeometry = new RoundEdgedBox(2.5, 2, 4, 0);
const plowMaterial = new THREE.MeshLambertMaterial( { color: '#eddde3' } );
const plow = new THREE.Mesh( plowGeometry, plowMaterial );

const bedGeometry = new RoundEdgedBox(20, 2.5, 10, 0);
const bedMaterial = new THREE.MeshLambertMaterial( { color: '#eddde3' } );
const bed = new THREE.Mesh( bedGeometry, bedMaterial );

const bedLowGeometry = new THREE.BoxGeometry(20.3, 1.5, 10.3);
const bedLowMaterial = new THREE.MeshPhongMaterial( { color: '#876046', specular: 'purple' } );
const bedLow = new THREE.Mesh( bedLowGeometry, bedLowMaterial );

const blanketGeometry = new RoundEdgedBox(15, 2.6, 10.1, 0);
const blanketMaterial = new THREE.MeshLambertMaterial( { color: '#3d2a2e' } );
const blanket = new THREE.Mesh( blanketGeometry, blanketMaterial );

scene.add(plow);
scene.add(bed);
scene.add(bedLow);
scene.add(blanket);

// Table

const tableGeometry = new THREE.BoxGeometry(20.3, 1, 6);
const tableMaterial = new THREE.MeshPhongMaterial( { color: '#30272d', specular: 'purple' } );
const table = new THREE.Mesh( tableGeometry, tableMaterial );

const stand1Geometry = new THREE.BoxGeometry(1, 3, 5.5);
const stand1Material = new THREE.MeshPhongMaterial( { color: '#30272d', specular: 'purple' } );
const stand1 = new THREE.Mesh( stand1Geometry, stand1Material );

const stand2Geometry = new THREE.BoxGeometry(1, 3, 5.5);
const stand2Material = new THREE.MeshPhongMaterial( { color: '#30272d', specular: 'purple' } );
const stand2 = new THREE.Mesh( stand2Geometry, stand2Material );

scene.add(table);
scene.add(stand1);
scene.add(stand2);

// Monitor

const monStandGeometry = new THREE.CylinderGeometry(0.35, 0.35, 2, 5);
const monStandMaterial = new THREE.MeshPhongMaterial( { color: '#2e302c', specular: 'purple' } );
const monStand = new THREE.Mesh( monStandGeometry, monStandMaterial );

const monSuppGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 5);
const monSupp = new THREE.Mesh( monSuppGeometry, monStandMaterial );

const monGeometry = new RoundEdgedBox(2, 4, 4, 0);
const mon = new THREE.Mesh( monGeometry, monStandMaterial );

const screen1Geometry = new RoundEdgedBox(4, 2.5, 0.3, 4);
const screen1 = new THREE.Mesh( screen1Geometry, monStandMaterial );

const screen2Geometry = new RoundEdgedBox(3.7, 2.2, 0.4, 4);
const screen2Material = new THREE.MeshPhongMaterial( { color: '#959cab', specular: 'purple' } );
const screen2 = new THREE.Mesh( screen2Geometry, screen2Material );

scene.add(monStand);
scene.add(monSupp);
scene.add(mon);
scene.add(screen1);
scene.add(screen2);

// Chair

const topChaGeometry = new RoundEdgedBox(3, 4, 0.6, 40);
const topChaMaterial = new THREE.MeshPhongMaterial( { color: '#963860', specular: 'purple' } );
const topCha = new THREE.Mesh( topChaGeometry, topChaMaterial );

const lowChaGeometry = new RoundEdgedBox(3, 3, 0.6, 40);
const lowChaMaterial = new THREE.MeshPhongMaterial( { color: '#4b2c3e', specular: 'purple' } );
const lowCha = new THREE.Mesh( lowChaGeometry, lowChaMaterial );

const chaStandGeometry = new THREE.CylinderGeometry(0.35, 0.35, 2, 5);
const chaStandMaterial = new THREE.MeshPhongMaterial( { color: '#24151a', specular: 'purple' } );
const chaStand = new THREE.Mesh( chaStandGeometry, chaStandMaterial );

const chaSuppGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 5);
const chaSupp = new THREE.Mesh( chaSuppGeometry, chaStandMaterial );

scene.add(topCha);
scene.add(lowCha);
scene.add(chaStand);
scene.add(chaSupp);

/* -- End all Geometry -- */

var light = new THREE.DirectionalLight('#ccb3e1', 4);
light.castShadow = true;
light.position.set(15,50, 30) .normalize();
scene.add(light);

ySpeed = 0.005;

// floor positions and rotations
floor.rotation.x = -.5*Math.PI;

floorboard.rotation.x = -.5*Math.PI;
floorboard.position.y = 0.01;

floorboard2.rotation.x = -.5*Math.PI;
floorboard2.rotation.z = .5;
floorboard2.position.y = 0.02;

floorboard3.rotation.x = -.5*Math.PI;
floorboard3.rotation.z = .7;
floorboard3.position.y = 0.03;

// bed parts
plow.position.x = -9;
plow.position.y = 2;
plow.position.z = 8.5;
plow.rotation.y = 0.5;

bed.position.x = -3;
bed.position.y = 1;
bed.position.z = 8.5;

blanket.position.x = -0.45;
blanket.position.y = 1;
blanket.position.z = 8.5;

bedLow.position.x = -3;
bedLow.position.y = 0.5;
bedLow.position.z = 8.5;

// table
table.position.y = 3.5;
table.position.z = -12;

stand1.position.y = 1.5;
stand1.position.x = 9;
stand1.position.z = -12;

stand2.position.y = 1.5;
stand2.position.x = -9;
stand2.position.z = -12;

// monitor
monStand.position.x = -6;
monStand.position.y = 5;
monStand.position.z = -13;

monSupp.position.x = -6;
monSupp.position.y = 4;
monSupp.position.z = -13;

mon.rotation.y = 0.3;
mon.position.x = 0;
mon.position.y = 6;
mon.position.z = -12;

screen1.rotation.y = 0.2;
screen1.position.x = -6;
screen1.position.y = 6;
screen1.position.z = -12.5;

screen2.rotation.y = 0.2;
screen2.position.x = -6;
screen2.position.y = 6;
screen2.position.z = -12.5;

//chair
topCha.rotation.x = 0.1;
topCha.position.y = 4.2;
topCha.position.z = -5;

lowCha.rotation.x = -.5*Math.PI;
lowCha.position.y = 2;
lowCha.position.z = -6.7;

chaSupp.position.z = -6.7;

chaStand.position.y = 1;
chaStand.position.z = -6.7;

// wall
wall1.rotation.y = -.5*Math.PI;
wall1.position.x = -15;
wall1.position.y = 11.25;

wall2.rotation.y = 0;
wall2.position.z = -15;
wall2.position.y = 11.25;

camera.position.x = 40;
camera.position.y = 20;
camera.position.z = 40;

light.position.y = 2;

// window
windo.rotation.y = -.5*Math.PI;
windo.position.x = -15;
windo.position.y = 11.25;

backout.rotation.y = -.5*Math.PI;
backout.position.x = -14.9;
backout.position.y = 11.25;

windSep1.rotation.x = 0.1;
windSep1.position.x = -14.9;
windSep1.position.y = 11.25;

windSep2.rotation.x = 1.7;
windSep2.position.x = -14.9;
windSep2.position.y = 11.25;

camera.lookAt(scene.position);

camera.position.y += 7;

function animate() {
	requestAnimationFrame( animate );
    floor.rotation.x += 0;
    floor.rotation.y += 0;

    light.position.y += ySpeed;

    if (light.position.y > 3){
        ySpeed = -0.005;
    }
    else if (light.position.y < 2){
        ySpeed = 0.005;
    }

	renderer.render( scene, camera );
}
animate();