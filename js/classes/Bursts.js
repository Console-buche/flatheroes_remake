import * as THREE from '../libs/three/build/three.module.js';
import { BurstShader } from '../shaders/BurstShader.js';
import { hero } from '../app.js';

export class Burst extends THREE.Points {
    constructor() {
        super();
        this.userData.physics = [];
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.gravity = new THREE.Vector3(0, -0.015, 0);
        this.dir = null; 
        this.parent = null;
        this.startPos = null;
        this.tima = 1.05;
        this.material = new THREE.ShaderMaterial({
            uniforms: null,
            vertexShader: null,
            fragmentShader: null,
            transparent: true,
            depthTest:false,
            alphaTest:0.3
        });

    }

    addTo(parent) {
        var vertices = [];
        var physics = [];
        var expSpread = [];
        var sizes = [];
        var spriteIds = [];
        var pointsIDs = [];
        const nbOfShards = (parent.name == "flatHero") ? Math.floor(Math.random() * 15) + 15 : Math.floor(Math.random() * 10) + 15;

        for (var i = 0; i < nbOfShards; i++) {



            var x = (parent.name !== "flatHero") ? 0 : Math.random() - 0.5;
           // var y = THREE.MathUtils.randFloatSpread(1);
            var y = THREE.MathUtils.randFloatSpread(1);
            var z = (parent.name !== "flatHero") ? 0 : Math.random() - 0.5;
            const dir = parent.direction || new THREE.Vector3(0,0,0);
            this.dir = dir;
            var vX = (Math.random() < 0.5) ? 0.009 : -0.009;
            var vY =  (dir.y < 0) ? 0.075 + Math.random() * 0.05 : -0.1 + Math.random() * -0.05;
            vX*=(y*3)+1;   

            //special treatment for Hero : dislocated particles
            if ( parent.name == "flatHero") {
                vX = (Math.random() * 0.32) - 0.16;
                vY = (Math.random() * 0.32) - 0.16;
            }

            var vSpreadY = Math.random()*7 + 1;   //if +x is lower than 1, then we get high jumping particles cause of division by n < 1

            this.velocity.x = vX;
            this.velocity.y = vY;

            this.gravity.y = (dir.y < 0) ? this.gravity.y : this.gravity.y * -1;

            //push attributes values before appending them to geometry
            expSpread.push(vSpreadY);
            physics.push(vX, vY);
            vertices.push(x, y, z);
            sizes.push(Math.random() + 0.75);
            spriteIds.push(Math.ceil(Math.random() * 2) - 1);
            pointsIDs.push(i);

        }

        this.userData.physics.push(physics);

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.geometry.setAttribute('phyz', new THREE.Float32BufferAttribute(physics, 2));  
        this.geometry.setAttribute('spread', new THREE.Float32BufferAttribute(expSpread, 1));
        this.geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ) );  
        this.geometry.setAttribute( 'spriteIds', new THREE.Float32BufferAttribute( spriteIds, 1 ) );  
        this.geometry.setAttribute( 'pointID', new THREE.Float32BufferAttribute( pointsIDs, 1 ) );  

        this.startpos = this.geometry.attributes.position.clone;

        /*
        this.material = new THREE.PointsMaterial({
            color: new THREE.Color(0.6, 0.6, 0.6),
            transparent: true,
            opacity: 0,
            size: (parent.name !== "flatHero") ? 0.4 : 0.8,
            depthWrite: false,
            depthTest: false
        });
        */

       var texture = new THREE.TextureLoader().load( "http://myotherspot.fr/00_LAB/FLATHEROES_REMAKE/v1.0/img/sheet.png" );
       texture.wrapS = THREE.ClampToEdgeWrapping;
       texture.wrapT = THREE.ClampToEdgeWrapping;

       const bs = new BurstShader();
       this.material.uniforms = bs.uniforms;
       this.material.uniforms.pointTexture.value = texture;

       this.material.fragmentShader = bs.fragment;
       this.material.vertexShader = bs.vertex;

        var points = new THREE.Points(this.geometry, this.material);
        this.parent = parent;
        parent.add(points);
    }

    reset() {
        const pos = this.startpos;
        for (let i = 0; i < this.geometry.attributes.position.count; i++) {
            var px =  Math.random() - 0.5;
            var py =  Math.random() - 0.5;
            var pz = 0

                //if (i == 0) {
                //console.log("updatin"); }
                this.geometry.attributes.position.setXYZ(
                    i,
                    px,
                    py,
                    pz
                );
           
    }
    
    this.geometry.attributes.position.needsUpdate = true;
}

/*
    displace() {
        
        
        const positions = this.geometry.attributes.position;
        const physics = this.geometry.attributes.phyz;
        const spread = this.geometry.attributes.spread;



        for (let i = 0; i < positions.count; i++) {
            
        //if (i == 0 ) console.log(heroPos)
            var px = positions.getX(i);
            var py = positions.getY(i);
            var pz = positions.getZ(i);

        const heroPos = hero.position.clone();
        const lePos = new THREE.Vector3(px, py, 0);
        //if (i == 0) console.log(lePos);
        var dist = lePos.distanceTo(heroPos);
        if (i == 0) console.log(dist);

             // let desired = new THREE.Vector3(1,1,1);
             if (dist < 1.5) {
                 
                let desired = new THREE.Vector3().subVectors(lePos, heroPos.add(new THREE.Vector3(0,0.5,0)));
                const u = desired.multiplyScalar(0.5);
                let nex =positions.getY(i)
                positions.setY(i,  nex + 0.1);
            }
        }
    }
    */
   updFromHeroPos() {
        
    // if (name) this.parent.material.opacity -= 0.05

     const positions = this.geometry.attributes.position;

     for (let i = 0; i < positions.count; i++) {

         var px = positions.getX(i);
         var py = positions.getY(i);
         var pz = positions.getZ(i);

        let herro = new THREE.Vector3(hero.position.x, Math.floor(hero.position.y), 0);
        let pPos = new THREE.Vector3(px, py, 0);

        let worldPos = this.parent.localToWorld(pPos);
        
         let d = hero.position.distanceTo(worldPos);
         let desired = new THREE.Vector3().subVectors(worldPos, hero.position).normalize().multiplyScalar(0.15);

         if (d < 1) {
            positions.setXYZ(
            i,
            px + desired.x,
            py + desired.y,
            pz
        );

        this.geometry.attributes.position.needsUpdate = true;
        }
  }

}

    update(name = undefined) {
        
       // if (name) this.parent.material.opacity -= 0.05

        const positions = this.geometry.attributes.position;
        const physics = this.geometry.attributes.phyz;
        const spread = this.geometry.attributes.spread;



        for (let i = 0; i < positions.count; i++) {
            
        //if (i == 0 ) console.log(heroPos)
            var px = positions.getX(i);
            var py = positions.getY(i);
            var pz = positions.getZ(i);
            var expSpread = spread.getY(i);

            
        
            //if ((this.dir.y < 0 && this.velocity.y < 0.25) || (this.dir.y > 0 && this.velocity.y > -0.25)  ) { //TODO buggy, gravity not applied to bot / dir top
            if ((this.dir.y < 0 ) || (this.dir.y > 0 )  ) { //TODO buggy, gravity not applied to bot / dir top

                var physX = physics.getX(i);
                let horizBurstY = (this.dir.y < 0) ? -1 : 1;
                var physY = physics.getY(i);

                //displace
                
                let newY = (horizBurstY < 0) ? py + (this.velocity.y / expSpread * 2) : py - (this.velocity.y / expSpread * 2);
                               
                //if (i == 0) {
                //console.log("updatin"); }
                positions.setXYZ(
                    i,
                    px + physX + this.velocity.x,
                    //py + physY + this.velocity.y,
                    newY ,
                    pz
                );

             } else if ((this.dir.x < 0 && this.velocity.x < 0.25) || (this.dir.x > 0 && this.velocity.x > -0.25)  ) { //TODO buggy, gravity not applied to bot / dir top

                var physX = physics.getX(i);
                var physY = physics.getY(i);
                let horizBurstX = (this.dir.x < 0) ? -1 : 1;
                const newX = (horizBurstX < 0) ? px + (this.velocity.y / expSpread * 2) : px - (this.velocity.y / expSpread * 2);
                //if (i == 0) {
                //console.log("updatin"); }
                positions.setXYZ(
                    i,
                    newX,
                    py + physX + this.velocity.x,
                    pz
                );
           
        } else if (this.dir == 0) {         //this.dir == 0 WRONG STATEMENT, THIS.DIR CANNOT BE ===0  since IT'S VECTOR 3. TODO : REWRITE THIS PART
            var physX = physics.getX(i);
            var physY = physics.getY(i);
            //if (i == 0) {
            //console.log("updatin"); }
            positions.setXYZ(
                i,
                px + physX,
                py + physY,
                pz
            );
           } else {
                this.material.opacity = 0;
            }
            
        }
        //this.velocity.y += this.gravity.y; //apply some sort of physics
        this.tima += 0.05;
        this.velocity.y = Math.exp(-this.tima * 2.0);
        //console.log(this.velocity.y);

        this.material.size -= 0.005;
        if (this.material.size < 0.025) this.material.opacity = 0;
        
        // this.material.opacity = 0.1;
        this.geometry.attributes.position.needsUpdate = true;
        this.updFromHeroPos();

        this.updateAttributes();

    }

    updateAttributes() {
        var attributes = this.geometry.attributes;

        for ( var i = 0; i < attributes.size.array.length; i ++ ) {

                //attributes.size.array[ i ] = Math.sin( 0.1 * i + this.tima ) / 100.;
                attributes.size.array[ i ] -= 0.015

            }

            attributes.size.needsUpdate = true;
            
        this.material.uniforms.livetime.value += 0.1;
    }

}