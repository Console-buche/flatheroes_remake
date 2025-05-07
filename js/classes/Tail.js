import * as THREE from '../libs/three/build/three.module.js';
import { scene } from '../app.js';

export class Tail {

    constructor(obj, color, length) {
      this.material = new THREE.LineBasicMaterial({color: "rgb(170, 107, 103)", transparent:true});
      this.nbofPoints = length;
      this.updVerts = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
      this.parentObj = obj;
      this.geometry = new THREE.BufferGeometry().setFromPoints( this.updVerts );
      this.line = new THREE.Line(this.geometry, this.material);
      this.alive = true;
    }     

    init(missile) {

        const missilePos = missile.position.clone();
        for (let i = 0; i < this.nbofPoints; i++) {
            this.updVerts[i] = missilePos;
        }
        this.line.visible = false;
        scene.add(this.line)
        //console.log(this.line);
    }

    kill() {
        this.alive = false;
        this.line.material.opacity = 0;
        this.line.material.needsUpdate = true;
    }

    update() {
        if (this.alive) {
      if (this.updVerts.length < this.nbofPoints) {
        this.updVerts.push(this.parentObj.position.clone());
      } else {
        this.updVerts = [this.parentObj.position.clone(), ...this.updVerts.slice(0, this.updVerts.length-1)]
      }

      if (this.updVerts.length == this.nbofPoints) {
        this.updVerts[0].copy(this.parentObj.position);
      } 

      if (this.updVerts.length > 0) {
       this.geometry.setFromPoints( this.updVerts );
      }
       
    } 
}

  }