import * as THREE from '../libs/three/build/three.module.js';

import {
    SpeedLinesShader
} from '../shaders/SpeedLinesShader.js';

const shader = new SpeedLinesShader();

export class SpeedLines extends THREE.Mesh {
    constructor() {
        super();
        // this.geometry = new THREE.PlaneBufferGeometry(4,4);
        /*this.material = new THREE.ShaderMaterial({
            uniforms: shader.uniforms,
            fragmentShader: shader.fragment,
            vertexShader: shader.vertex
        });*/
        this.heroLastPos = new THREE.Vector3();
        this.delayByModFrames = 10;
        this.delayCounter = 0;
        this.material = new THREE.MeshBasicMaterial({
            color: "rgb(114, 156, 36)",
            side: THREE.DoubleSide,
            opacity:0               //WARNING TOOD : THIS DISABLES THIN STANDARD LINES FROM VIEW BUT THEY'RE STILL HERE & TO BE REMOVED
        });
        this.lines = []; //3 lines, each composed of 3 knots
        this.thickLines = [];
        this.knotTesters = [];
        this.counter = 0;
        this.getPosEveryNFrames = 40;

        this.testSpheres = [];
        this.sphere1 = null;
        this.sphere2 = null;

        this.time = 0;


    }

    makeThickLine(hero, offset, lengthFactor) {
        const thickness = 0.2;
        var geometry = new THREE.BufferGeometry();
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        const hPos = hero.position;
        var vertices = new Float32Array( [
            hPos.x, hPos.y-thickness/2, 0.0,
            hPos.x, hPos.y+thickness/2, 0.0,
            hPos.x - 5, hPos.y+thickness/2, 0.0,

            hPos.x - 5, hPos.y+thickness/2, 0.0,
            hPos.x - 5, hPos.y-thickness/2, 0.0,
            hPos.x, hPos.y-thickness/2, 0.0
        ] );

        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        var material = new THREE.MeshBasicMaterial({
            color: "rgb(114, 156, 36)",
            transparent: true
        });
        var mesh = new THREE.Mesh( geometry, material );

        const thickLine = {object : mesh, thickness:0.2, lengthFactor: lengthFactor,
            homingTarget : hero.position.clone(),
            verticesSets: { 
                            root : { bot: [0,1,2,15,16,17], top: [3,4,5], },
                            tail : { bot: [12,13,14], top : [6,7,8,9,10,11]}
                        }};

        this.thickLines.push(thickLine);
        console.log(this.thickLines);

        this.add(mesh);
        mesh.translateY(offset);

        this.updateThickLines(hero);

    }

    animateLines(hero) {

        //console.log("animating tail towards root")
        
            
        this.thickLines.forEach(l => {
            let positions = l.object.geometry.attributes.position.array;
            Object.entries(l.verticesSets.tail).forEach( set => {
                const offset = (set[0] == "bot") ? l.thickness/-2 : l.thickness/2;
                const vals = set[1];

            for (let i = 0; i < vals.length; i+=3) {

            const refPos = new THREE.Vector3().copy(hero.position);
            const tailPos = new THREE.Vector3().copy(l.homingTarget);
            
            const alignedPosAA = this.crossIt(tailPos, refPos, offset);


            // console.log(vals[i])
                positions[vals[i]] = alignedPosAA.x
                positions[vals[i+1]] = alignedPosAA.y
                positions[vals[i+2]] = 0;
            }

            

            l.object.geometry.attributes.position.needsUpdate = true;
                
            });
       })



    }

    updateThickLines(hero) {
        this.time++
        if (this.thickLines.length > 0) {
            
            this.thickLines.forEach(l => {
    
            const a = l.object.geometry.attributes.position.array;
                    const rootPoint = l.verticesSets.root.bot;
                    const tailPoint = l.verticesSets.tail.bot;
                    const lengthFactor = l.lengthFactor;

                    const [xR, yR, zR] = rootPoint;
                    const [xT, yT, zT] = tailPoint;

                    const dist = new THREE.Vector3(a[xR], a[yR], a[zR]).distanceTo(new THREE.Vector3(a[xT], a[yT], a[zT]));
                    //console.log(dist);
                    if (dist > 0.1) {
                        
                        const d = new THREE.Vector3().subVectors(hero.position.clone(), l.homingTarget).normalize().multiplyScalar(lengthFactor * dist );
                        l.homingTarget = l.homingTarget.add(d);

                        this.heroLastPos.add(d);
                        this.animateLines(hero);
                    } 

            })
        }
        
    

        this.thickLines.forEach(l => {
        let positions = l.object.geometry.attributes.position.array;

        //update root 
        //make it stick to hero position with offset and keeping angle 
        Object.entries(l.verticesSets.root).forEach( set => {
            const offset = (set[0] == "bot") ? l.thickness/2 : l.thickness/-2;
            const vals = set[1];
                for (let i = 0; i < vals.length; i+=3) {


                const refPos = new THREE.Vector3().copy(hero.position);
                const tailPos = new THREE.Vector3().copy(l.homingTarget);
            
                const alignedPosAA = this.crossIt(refPos, tailPos, offset);

                    positions[vals[i]] = alignedPosAA.x 
                    positions[vals[i+1]] = alignedPosAA.y 
                    positions[vals[i+2]] = 0

                }
                });



            l.object.geometry.attributes.position.needsUpdate = true;
        });
    }

    crossIt(repere, p, offset) {

        var cross = new THREE.Vector3().subVectors(repere, p);
        
        const off = (offset > 0) ? 1 : -1;
        cross.cross(new THREE.Vector3(0,0,off));
        cross.normalize();
        
        cross.multiplyScalar(offset);
        const ret = (offset > 0 ) ? new THREE.Vector3().copy(repere).add(cross) : new THREE.Vector3().copy(repere).sub(cross);
        return ret
    }

    init(hero) {

        const isMissile = hero.type;
        if (isMissile == "homing") {
        //middle segment : attached to the center of hero
        var points = [];
        points.push(new THREE.Vector3(hero.position.x, hero.position.y, 0));
        points.push(new THREE.Vector3(hero.position.x - 5, hero.position.y, 0));

        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        const centerLine = new THREE.Line(geometry, this.material);
        centerLine.userData.offsetY = 0;
        this.lines.push(centerLine);

        this.lines.forEach(l => this.add(l));

        } else {

            //middle segment : attached to the center of hero
        var points = [];
        points.push(new THREE.Vector3(hero.position.x, hero.position.y, 0));
        points.push(new THREE.Vector3(hero.position.x - 5, hero.position.y, 0));

        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        const centerLine = new THREE.Line(geometry, this.material);
        centerLine.userData.offsetY = 0;
        this.lines.push(centerLine);

        this.lines.forEach(l => this.add(l));
        
        //top segment : attached to the top of hero
        var points = [];
        points.push(new THREE.Vector3(hero.position.x, hero.position.y + 0.5, 0));
        points.push(new THREE.Vector3(hero.position.x - 5, hero.position.y + 0.5, 0));

        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        const topLine = new THREE.Line(geometry, this.material);
        topLine.userData.offsetY = 0.5;
        this.lines.push(topLine);

        //bottom segment : attached to the top of hero
        var points = [];
        points.push(new THREE.Vector3(hero.position.x, hero.position.y - 0.5, 0));
        points.push(new THREE.Vector3(hero.position.x - 5, hero.position.y - 0.5, 0));

        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        const bottomLine = new THREE.Line(geometry, this.material);
        bottomLine.userData.offsetY = -0.5;
        this.lines.push(bottomLine);

        }

        //add lines to hero
        this.lines.forEach(l => this.add(l));

        console.log(this.lines);

        //define tester
        var geometryKnot = new THREE.SphereGeometry(0.5, 32, 32);
        var material = new THREE.MeshBasicMaterial({
            color: "rgb(255*0.8, 255*0.5, 0.)"
        });
        var sphere = new THREE.Mesh(geometryKnot, material);

       // this.testSpheres.push(sphere);
        const testerObj = {
            obj: sphere,
            position: new THREE.Vector3(0, 0, 0)
        }
        this.knotTesters.push(testerObj);
        sphere.visible = false

       var geometryKnot = new THREE.SphereGeometry(0.5, 32, 32);
        var material = new THREE.MeshBasicMaterial({
            color: "rgb(255*0.8, 255*0.5, 0.)"
        });
        var sphere2 = new THREE.Mesh(geometryKnot, material);
        this.add(sphere2);

        this.testSpheres.push(sphere2);

        
       var geometryKnot = new THREE.SphereGeometry(0.5, 32, 32);
       var material = new THREE.MeshBasicMaterial({
           color: "rgb(255*0.8, 255*0.5, 0.)"
       });
       var sphere3 = new THREE.Mesh(geometryKnot, material);
       this.add(sphere3);
        this.testSpheres.push(sphere3);

        console.log(this.testSpheres);

        console.log(this.knotTesters);

        this.knotTesters.forEach((k, i) => this.add(this.knotTesters[i].obj));



        

    }


    update(hero) {

        if (this.thickLines) {
          this.updateThickLines(hero);
        }


    }

    catchUp(hero, p, offset) {

        let newPos = new THREE.Vector3(p.x, p.y, p.z);
        let desired = new THREE.Vector3().subVectors(hero.position, p.add(new THREE.Vector3(0, offset, 0)));


        const d = newPos.distanceTo(hero.position);
        if (d >= 0) {
            const speed = (offset == 0) ? d * 0.18 : d * 0.13;
            const speedOfHoming = (speed == d * 0.18) ? d * 0.05 : d*0.13;
            let t = desired.normalize().multiplyScalar(speedOfHoming);
            //console.log(p)
            newPos.add(t);
        } else {
            newPos = p;
        }

        return newPos;

    }
}