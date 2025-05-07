import * as THREE from '../libs/three/build/three.module.js';
import {
    scene,
    hero,
    floors,
    missiles,
    manager,
    missMat,
    nbOfMissiles
} from '../app.js';
import {
    Burst
} from './Bursts.js';
import {
    slv
} from '../app.js';
import {
    MissileShader
} from '../shaders/MissileShader.js';
import {
    SpeedLines
} from './SpeedLines.js';
import {
    Tail
} from './Tail.js';


export class Missile extends THREE.Mesh {
    constructor(startPos, dir, spawnOrder, salveIndex, levelOptions) {
        super();
        /*this.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.9,0.9,0.9),
            opacity: 0,
            transparent: true,
            map: new THREE.TextureLoader().load('../../img/tex.png')
        });*/
        this.material = new THREE.ShaderMaterial({
            uniforms: null,
            vertexShader: null,
            fragmentShader: null,
            transparent: true
        });
        this.geometry = new THREE.PlaneGeometry(1.25, 1.25);
        this.path = new Map([ //since map is static, no need to raycast for end of path. Only need to check collision
            ["startPos", startPos],
            ["endPos", null]
        ]);
        this.direction = dir;
        this.dist = 9999;
        this.spawnOrder = spawnOrder;
        this.states = {
            isPreparing: false,
            isReady: false,
            isDead: false,
            isDone: false
        };
        this.burst = null;
        this.initialDelay = 3000;
        this.options = levelOptions;
        this.salve = salveIndex;
        this.delayBetweenMissile = levelOptions.salvesReadyStatusAtStart[this.salve].delayBetweenMissiles;
        this.salve = salveIndex;
        this.type = levelOptions.salvesReadyStatusAtStart[this.salve].type;
        this.staticStart = levelOptions.salvesReadyStatusAtStart[this.salve].staticStart;
        this.nextSalveTriggerIndex = levelOptions.nextSalveTriggerIndex;
        this.hasWaitedItsTurn = false;
        this.hasStartedToShowUp = false;
        //this.isHorizontal = levelOptions.horiz;
        this.isHorizontal = levelOptions.salvesReadyStatusAtStart[this.salve].horiz;
        this.speed = levelOptions.salvesReadyStatusAtStart[this.salve].speed; //CONTROLS SPEED OF MISSILES
        this.frameBufferWait = (salveIndex.slice(-1) * levelOptions.salvesReadyStatusAtStart[this.salve].delay) + spawnOrder * this.delayBetweenMissile; //CONTROLS DELAY BETWEEN MISSILES. THE HIGHER THE MULTIPLIER, THE LONGER THE DELAY
        //NOTE ON FrameBuffterWait : first part is delay between each salve to be added based on salve number. This works if they're followed by one another, once at a time
        //will need more options for that for sync salves later on 
        this.hitHero = false;

        //homing missile phys
        this.tail = null;
        this.homingPhysics = {
            velocity : new THREE.Vector3(),
            acceleration : new THREE.Vector3(),
            bounceAgainstStructure : new THREE.Vector3(),
            aggressiveSpeed: this.speed,
            passiveSpeed: 0.01
        }
        this.homingRules = {
            aggressive:false,
            selfDestructCountDown: null,
            isFleeing: false,
            hasDetectedHero: false
        }
        
        //speed lines
        this.speedLines = null;
        this.speedLines_holder = null;
    }

    async init() {

      //  this.tail.init();
        this.homingRules.selfDestructCountDown = 200 + Math.random() * 300
/*
        var linesHolder = new THREE.Object3D();

        
        this.speedLines_holder = linesHolder;
        scene.add(this.speedLines_holder)

        const speedLines = new SpeedLines();
        this.speedLines = speedLines;

        this.speedLines_holder.add(this.speedLines);

        this.speedLines.init(this);   //DISABLES STANDARD LINES
        */

        const s = (this.type == "homing") ? 2 : 1;
        const r = (this.type == "homing") ? 0.2 : 0.15; //default missile radius = 0.15, homing = 0.3
        const ms = new MissileShader(r);
        this.material.uniforms = ms.uniforms;
        this.material.fragmentShader = ms.fragment;
        this.material.vertexShader = ms.vertex;

        this.material.uniforms.missileType.value = (this.type == "normal") ? 0 : 1;
        // console.log(this.salve.slice(-1));
        //step 1 : spawn
        this.scale.set(s,s,s);
        if (this.isHorizontal) this.geometry.rotateZ(Math.PI / 2);
        this.position.copy(this.path.get("startPos"));
        this.findEndPos();
        let particles = new Burst();
        this.burst = particles;
        particles.addTo(this);
        scene.add(this);

        
        //ADD TAIL
        this.homingPhysics.velocity = new THREE.Vector3(0,0,0);
        this.homingPhysics.acceleration = new THREE.Vector3(0,0,0);
        
        this.tail = new Tail(this, 0x000000, 15);
        this.tail.init(this);

        //ADD STATIC START
        if (this.type == "homing" && this.staticStart !== null) {
            this.homingPhysics.acceleration.add(new THREE.Vector3(Math.random() * 50 - 25,Math.random() * 50 - 25,0).normalize().multiplyScalar(0.9))
            this.homingRules.aggressive = true;
        }

    }

    checkCollisions(cubeObject) {
        
        let pushAwayForce = new THREE.Vector3(0,0,0);
        missiles.forEach(c => {
          if (c !== cubeObject) {
          
          let cube = c;
          let dist = cube.position.distanceTo(cubeObject.position.clone());
          if (dist < 0.25) {
            let dir = new THREE.Vector3().subVectors(cubeObject.position.clone(), cube.position.clone());
            dir.normalize().multiplyScalar(0.01);
            pushAwayForce.add(dir);
          }

          }
        });
        pushAwayForce.multiplyScalar(10);
        cubeObject.homingPhysics.acceleration.add(pushAwayForce);
    }


    chaseAfter(obj, target) {
         let dist = obj.position.distanceTo(target.position);
         this.triggerAggressive(dist);
         //if (this.staticStart == null) 
            this.checkCollisions(obj);
        if (dist > 0) {
          
          const speed = (this.homingRules.aggressive) ? this.homingPhysics.aggressiveSpeed : this.homingPhysics.passiveSpeed;
          //console.log(speed)
          this.tail.line.visible = (this.homingRules.aggressive) ? true : false;
          let dir = new THREE.Vector3().subVectors(target.position.clone(), obj.position.clone());
          let marchTo = dir.normalize().multiplyScalar(0.03);
          obj.homingPhysics.acceleration.add(marchTo);
          
          obj.homingPhysics.velocity.normalize().multiplyScalar(speed);
          
          obj.homingPhysics.velocity.add(obj.homingPhysics.acceleration);
          
          obj.position.add(obj.homingPhysics.velocity);
          
          obj.homingPhysics.acceleration.multiplyScalar(0);
        }
    }

    triggerAggressive(d) {
        if (this.material.uniforms.growthAggressive.value > 1.75) {
            this.homingRules.aggressive = true;
        } 
        
        if (d < 15) {
            this.homingRules.hasDetectedHero = true;
        }

        if (this.homingRules.hasDetectedHero) {
            this.material.uniforms.growthAggressive.value += 0.045;
           
        }
    }

    triggerMove() {
        this.setState("isReady");
        if (this.spawnOrder == this.nextSalveTriggerIndex) {
            slv.salves.set("salve" + (parseInt(this.salve.slice(-1), 10) + 1), true);
            //console.log(parseInt(this.salve.slice(-1), 10)+1, true);
        };
    }

    showUp(t) {
        if (!this.hasStartedToShowUp) {
            this.hasStartedToShowUp = true;
            const audio = (this.type == "homing") ? document.getElementById("homing_go") : document.getElementById("pew");
            const audio2 = audio.cloneNode(true); //TODO : research, which is better : clone node, or add on init ? I think add on init ?
            audio2.volume = 0.1;
            audio2.play();
            if (this.type =="normal") {
            setTimeout(function () {
                const audio3 = document.getElementById("thudPew");
                const audio4 = audio3.cloneNode(true); //TODO : research, which is better : clone node, or add on init ? I think add on init ?
                audio4.volume = 0.1;
               audio4.play();
            }, 50);
          }
        }

        this.material.uniforms.growth.value += 0.025;
        /*
        if (this.material.opacity <= 1) {
            this.material.opacity += 0.015;
        } else {
            this.material.opacity = 1;
        }

        if (this.scale.y <= 1.75) {
            this.scale.x += 0.05;
            this.scale.y += 0.025
        } /*else {
            this.scale.y = 1.25;
            this.scale.x = 0.95;
        }*/


    }

    buffUpFrames() {
        this.frameBufferWait -= 1;
        if (this.frameBufferWait <= 0) this.setState("isPreparing");
    }

    async update() {

       // this.speedLines.update(this);

        if (slv.salves.get(this.salve)) {
            if (!this.states.isPreparing && !this.states.isReady && !this.states.isDead && !this.states.isDone) {
                this.buffUpFrames();
            }
            if (this.states.isPreparing) {

                this.showUp();
                if (this.material.uniforms.growth.value >= 3.) {
                    this.triggerMove();
                    // console.log(this.states.isReady)
                }

            } else if (this.states.isReady) {

                if (this.type == "normal") {
                    this.moveNormalMissile();
                } else {
                    this.moveHomingMissile();
                }

            } else if (this.states.isDead ) {
                if (this.burst.material.uniforms.isVisible.value < 1.0 && this.type !== "homing")
                    this.burst.material.uniforms.isVisible.value = 1.0;
                this.die();
                // console.log("bouya")
                this.burst.update();
            }

            //explodes everything on hero death
            if (hero.isHit) {
                //reveal death particles
                if (this.burst.material.uniforms.isVisible.value < 1.0)
                    this.burst.material.uniforms.isVisible.value = 1.0;
                //level cannot be won then, so do not trigger this.die()                
                //do the actual bursting
                this.burst.update();
            }

            //make death circle move after death
            if (this.states.isDead || this.states.isDone) {
                if (this.type =="homing") {
                this.material.uniforms.implodeTimer.value = (this.material.uniforms.implodeTimer.value < 1.) ? this.material.uniforms.implodeTimer.value + 0.024 : 1.;
                
                this.scale.x = (this.material.uniforms.implodeTimer.value < 1.) ? this.scale.x + 0.04 : this.scale.x
                this.scale.y = this.scale.x;
                this.scale.z = this.scale.x ;
                this.rotation.z = (this.material.uniforms.implodeTimer.value < 1.) ? this.rotation.z + 0.01 : this.rotation.z
                //this.material.uniforms.implodeTimer.value += 0.012;
                }
            }
        }
    }

    moveNormalMissile() {
        this.dist = this.position.distanceTo(this.path.get("endPos"));
        if (this.dist > 0.5) {
            //step 2 : move
            let dir = new THREE.Vector3().subVectors(this.path.get("endPos"), this.position);
            dir.normalize();
            dir.multiplyScalar(this.speed);
            this.position.add(dir);
            
            this.collisionCheck();
            
        } else {
            //this.tail.kill();
            this.setState("isDead");
        }
    }

    

    moveHomingMissile() {

        const distToClosestStruct = this.distToClosestStruct();
        this.dist = distToClosestStruct.dist;

        //when missile approaches structure, make it try to avoid it (structures emit a repulsion force)
        if (this.dist < 2 && !this.homingRules.isFleeing) {
            let dir = new THREE.Vector3().subVectors(hero.position.clone(), this.position.clone());
                    let marchTo = dir.normalize().multiplyScalar(0.03);
                    this.homingPhysics.acceleration.add(marchTo);
            const goAround = new THREE.Vector3().subVectors(this.position.clone(), distToClosestStruct.pos).multiplyScalar(0.05).multiply(new THREE.Vector3(1,0,1));

            this.homingPhysics.acceleration.add(goAround);
        }

        //when missile hits structure, makes it bounce and flee
        if (this.dist < 1 && !this.homingRules.isFleeing ) {
            this.homingRules.isFleeing = true;
            const bounceDir = new THREE.Vector3().subVectors(this.position.clone(), distToClosestStruct.pos).multiplyScalar(0.75) 
            this.homingPhysics.acceleration.add(bounceDir);
        
        //after fleeing and getting away from structure, makes missile chase again
        } else if (this.dist > 3 && this.homingRules.isFleeing) {
            this.homingRules.isFleeing = false
        }

        //stops to die when about to explode
        if (this.homingRules.selfDestructCountDown > 40) {
                this.collisionCheck();
                if (!this.homingRules.isFleeing) { 
                    this.chaseAfter(this, hero);
                } else {
                    this.position.add(this.homingPhysics.velocity);
                    
        this.position.x = (this.position.x >= -12) ? this.position.x : -12;
        this.position.x = (this.position.x <= 22) ? this.position.x : 22;
                }
                
        }


        
        this.updateHomingLife();
        this.tail.update();
    }   

    fadeEndLevel() {
        // console.log("bouya")
        this.material.opacity = 0;
        this.material.depthTest = false; //disables occlusion on particles from 0 opacity parent missile

        this.burst.update();
    }

    collisionCheck() {
        let dist = this.position.distanceTo(hero.position);
        if (dist <= 1) {
            // console.log("BOOM") 
            //hero.explode()
            this.explode();
        }
    }

    updateProgressRing() {

        let progress = 0;
        const el = document.querySelector('progress-ring');
        el.setAttribute('progress', progress);

    }

    explode() {
        let dist = this.position.distanceTo(hero.position);
        if (dist <= 1) {
             hero.material.color = new THREE.Color(0, 0, 0);
             hero.material.opacity = 0;
             //  hero.burst.update();
             hero.isHit = true;
         }
        if (!this.hitHero) {
            setTimeout(() => {
                manager.nextLevel("level" + manager.currentLevel);
            }, 2000);
            manager.isFrozen = true;
            this.hitHero = true;
            missiles.forEach(m => m.material.uniforms.growth.value = 0.0)
        }
    }

    async delay(t) {
        return new Promise(resolve => {
            setTimeout(resolve, t);
        });
    }

    die() {

        this.material.depthTest = false; //disables occlusion on particles from 0 opacity parent missile

        this.children[0].material.opacity = 1; //SHOW PARTICLES : TODO : make this part of the burst class and not here...
        if (!this.states.isDone) {
            const audio = (this.type == "homing") ? document.getElementById("homing_die") : document.getElementById("plank");
            const audio2 = audio.cloneNode(true); //TODO : research, which is better : clone node, or add on init ? I think add on init ?
            audio2.volume = 0.1;
            audio2.play();
            this.states.isDone = true;
            this.material.uniforms.growth.value = 0.0;
            //update counter ring
            manager.missilesTotal -= 1;
            let progress = manager.missilesTotal / manager.remainingMissiles;
            //console.log(progress);
            const el = document.querySelector('progress-ring');
            el.setAttribute('progress', 100 - (100 - progress * 100));

            const levelIsended = missiles.every(this.checkIfDone);
            if (levelIsended) {
                const nextLevel = parseInt(manager.currentLevel, 10) + 1;
                manager.nextLevel(`level${nextLevel}`);
            } else {
                // console.log("lvl still runnin")
            }
        }
        //console.log(this.burst)
    }

    findEndPos() {
        var ray = new THREE.Raycaster();
        // console.log(this.path.get("startPos"));
        ray.set(this.path.get("startPos"), this.direction);

        let intersection = ray.intersectObjects(floors.children);
        //console.log(floors.children);
        const p = new THREE.Vector3(intersection[0].point.x, intersection[0].point.y, 0);

        this.path.set("endPos", p);

        //console.log(p);

    }

    distToClosestStruct() {
        var ray = new THREE.Raycaster();
        // console.log(this.path.get("startPos"));
        let dir = new THREE.Vector3().subVectors(hero.position.clone(), this.position.clone()).normalize();
        ray.set(this.position.clone(), dir);

        let intersection = ray.intersectObjects(floors.children);
        return {dist:intersection[0].distance, pos:intersection[0].point}
    }

    //set new state to true and inactive states to false
    setState(activeState) {
        Object.keys(this.states).forEach(state => {
            this.states[state] = (activeState == state) ? true : false
        });
    }

    //utils check whether done

    checkIfDone(m) {
        return m.states.isDone === true;
    }

    updateHomingLife() {
        if (this.type == "homing" && this.homingRules.aggressive) {
            
        this.material.uniforms.time.value += 1;
            if (this.homingRules.selfDestructCountDown > 0) {
                this.homingRules.selfDestructCountDown--;
                this.material.uniforms.amountOfRed.value += 0.01;
                this.tail.material.color.r = this.material.uniforms.amountOfRed.value;
            } else {
                this.setState("isDead");
                this.tail.kill();
            }
        }
    }

}