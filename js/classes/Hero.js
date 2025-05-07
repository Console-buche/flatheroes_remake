import * as THREE from '../libs/three/build/three.module.js';
import {
    Mover
} from './Mover.js';
import {
    plight,
    scene,
    manager,
    missiles
} from '../app.js';
import {
    Burst
} from './Bursts.js';
import {
    HeroShader
} from '../shaders/HeroShader.js';
import {
    SpeedLines
} from './SpeedLines.js';
import {
    SpeedLinesShader
} from '../shaders/SpeedLinesShader.js';

export class Hero extends THREE.Mesh {
    constructor(name) {
        super();
        this.leName = name
        this.name = name;
        this.height = 1;
        this.light = plight;
        this.width = 1;
        this.geometry = new THREE.BoxGeometry(this.width, this.height, 0.25);
        this.material = new THREE.MeshLambertMaterial({
            color: "rgb(114, 156, 36)",
            transparent: true
        });
        /*
        this.material = new THREE.ShaderMaterial({
            uniforms: null,
            vertexShader: null,
            fragmentShader: null,
            transparent: true
        });
        */
        this.lastPos = null;
        this.heroName = name;
        this.name = name;
        this.mover = new Mover(this);
        this.floorHeight = 0.5;
        this.accel = new THREE.Vector3(0, 0, 0);
        this.velo = new THREE.Vector3(0, 0, 0);
        this.dirX = 0;
        this.forces = {
            gravity: 0.025,
            falling: 0.001
        }
        this.burst = null;
        this.isHit = false;
        this.startPos = null;
        this.speedLines = null;
        this.speedLines_holder = null;
        this.ninjaDashing = false;
        this.linesShader = null;
        this.linesShaderPlane = null;
    }

    init() {

        //in case of using shadermat, hook up the uniforms 

        /*
        const ms = new HeroShader();
        this.material.uniforms = ms.uniforms;
        this.material.fragmentShader = ms.fragment;
        this.material.vertexShader = ms.vertex;
        */

        //add speed lines shader + background canvas
        const linesShader = new SpeedLinesShader();
       
        this.linesShader = linesShader;
        var geometry = this.linesShader._geometry;
        var material = this.linesShader._material;
        var plane = new THREE.Mesh( geometry, material );
        //plane.geometry.translateY(20)
        //plane.position.x = 5
        scene.add( plane );
        this.linesShaderPlane = plane;
        this.linesShader.initFollowers();



        //add particles
        let particles = new Burst();
        this.burst = particles;
        particles.addTo(this);
        this.startPos = new THREE.Vector3(0, 31, 0);
        this.position.copy(this.startPos);
        scene.add(this);

        //add speedlines
        var linesHolder = new THREE.Object3D();

        this.speedLines_holder = linesHolder;
        scene.add(this.speedLines_holder)

        const speedLines = new SpeedLines();
        this.speedLines = speedLines;

        this.speedLines_holder.add(this.speedLines);

      //  this.speedLines.init(this);   //DISABLES STANDARD LINES
        const dis = this;
        /*
        setTimeout(function() {
            dis.speedLines.makeThickLine(dis, 0.35, 0.13);
            dis.speedLines.makeThickLine(dis, 0, 0.15);
            dis.speedLines.makeThickLine(dis, -0.35, 0.13);
        }, 3500);
        */

    }

    handleMove(e) {

        this.mover.handleMove({
            [e.type]: e.keyCode
        });
    }

    ninjaDash(state) {
        this.ninjaDashing = state;
        if (state) {
            this.material.color = new THREE.Color("rgb(255, 0, 0)");
            this.material.opacity = 0.3;
            this.scale.set(1.1, 0.9, 1.1)
        } else {
            this.material.color = new THREE.Color("rgb(114, 156, 36)");
            this.material.opacity = 1;
            this.scale.set(1,1,1)
        }
    }


    update() {
        //save last pos before updating
        this.lastPos = this.position.clone();
        

        if (this.ninjaDashing) {
        }
        //update speed lines
        this.speedLines.update(this);

        let hPos = this.position.clone();
        missiles.forEach(m => {
            if (m.burst) {
                m.burst.material.uniforms.heroPos.value = hPos;
                m.burst.material.uniforms.needUpdate = true;
            }
        })
        // in case of using shadermat, update breathing time uniform below
        // this.material.uniforms.breathTime.value += 0.1;

        if (this.isHit) {
            missiles.forEach(m => m.tail.kill())
            //reset hero rot since particles are attached, so they don't fly off along local hero axis
            this.rotation.set(0, 0, 0);
            //this.material.opacity = 0;
            //this.material.depthTest = false;
            this.children[0].material.opacity = 1; //SHOW PARTICLES : TODO : make this part of the burst class and not here...
            
            //show death particles upon death
            if (this.burst.material.uniforms.isVisible.value < 1.0)
                    this.burst.material.uniforms.isVisible.value = 1.0;
            //trigger actual burstin
            this.burst.update();    //TODO : make hero burst a bit more spectatular...

            //console.log("bouya")
        } else {
            //Destruct this.mover for clearer use
            const {
                jump,
                isFalling,
                isHanging
            } = this.mover.physics.state;
            const {
                physics,
                boosting
            } = this.mover;

            const a = this.mover.physics.state;
            /*
            a.forEach((state) => {
                console.log(state.active)
            })
            */

            //record last active state
            Object.entries(a).forEach((state) => {
                //console.log(state[1].active)
                if (state[1].active) {
                    this.mover.lastAction = state[0];
                }
            });

            //MANAGE POSITION
            this.mover.updatePhysics();
            let oldPos = new THREE.Vector3().copy(this.position);

            const dir = this.mover._speed;
            dir.normalize();
            dir.multiplyScalar(this.mover._dampenFactor);

            //add choppy square wheel feel when box rolling and is not airborne
            if (!jump.active && !isFalling.active) {
                const boostFactor = (boosting) ? 3 : 1.15;
                dir.x = dir.x * (physics.squareWheelMultiplier * boostFactor) * boostFactor;
            }

            var p = new THREE.Vector3().subVectors(this.position.add(dir), this.position);
            this.mover.velocity = p;

            //if (this.mover.physics.state.jump.active && !this.mover.physics.state.isHanging.active) {
            //MANAGES JUMP UP AND DOWN
            if (jump.active) {

                this.velo.y = 0;
                physics.acceleration.add(physics.forces.gravity);

                physics.velocity.add(physics.acceleration);

                //check for right wall and prevents going through. TODO : check for left wall
                let newPos = new THREE.Vector3().copy(this.position).add(physics.velocity);
                //newPos.x = (newPos.x >= (this.mover.maxX)) ? this.mover.maxX : newPos.x;


                this.position.set(newPos.x, newPos.y, newPos.z);

                this.position.y = (this.position.y <= (this.floorHeight + 0.01)) ? this.floorHeight : this.position.y;

                physics.acceleration = new THREE.Vector3(0, 0, 0);
                if (this.position.y <= this.floorHeight) {
                    physics.velocity.multiplyScalar(0);
                    jump.active = false;

                    //finish tween when falling down and rolling : accelerate rotation to prevent sliding away in a big slow roll
                    //this.mover.activeTween._duration = (this.mover.activeTween._duration > 50) ? this.mover.activeTween._duration *= 0.5 : 50;
                    //this.mover.speed = new THREE.Vector3(0, 0, 0);
                }

            }

            //MANAGES FLAT MOVEMENT WHEN NOT AIRBORNE AND NOT SLIDING DOWN
            if (!jump.active && !isHanging.active) {
                //MANAGE ROTATION
                let bobbing = Math.abs(Math.sin(this.rotation.z % (Math.PI) * 2)) / 4;

                if (this.position.y > this.floorHeight + this.height && !jump.active) {
                    isFalling.active = true;
                    this.accel.y -= this.forces.gravity;
                    this.velo.add(this.accel);
                    this.position.add(this.velo);
                    this.accel.multiplyScalar(0);

                } else {
                    isFalling.active = false;
                    this.position.y = bobbing + this.floorHeight;
                    this.mover.canDoubleJump = true;
                    //this.mover.physics.state.isHanging.active = false

                    this.mover.lastAction = "isRolling";
                    this.accel.multiplyScalar(0);
                    this.velo.multiplyScalar(0);
                }

                //this.mover.physics.velocity.multiplyScalar(0.01);
            }

            //MANAGES SLIDING DOWN
            if (isHanging.active && !jump.active) {
                //  this.mover.physics.velocity.multiplyScalar(0);
                // console.log("HOOOOLD")
                isFalling.active = true;
                this.accel.y -= this.forces.falling;
                this.velo.add(this.accel);
                this.position.add(this.velo);
                this.accel.multiplyScalar(0);
            }

            this.dirX = (oldPos !== this.position) ? true : false; //true means has moved horizontaly


            if (this.position.x >= this.mover.maxX) {
                this.position.x = this.mover.maxX;
            }
            if (this.position.x <= this.mover.minX) {
                this.position.x = this.mover.minX;
            }

            this.linesShader.update(this);

            //MISC

            this.light.position.copy(this.position);
            this.light.position.y = -999; //DISABLES LIGHT FROM AFFECTING SCENE : KEEP IT DYNAMIC FOR LATER USE MAYBE

        }

    }
}