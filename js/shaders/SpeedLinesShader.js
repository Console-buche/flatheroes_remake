import { scene } from '../app.js';

export class SpeedLinesShader {
    constructor() {
        this.uniforms = { 
            color: { value: new THREE.Color( 0xFF0000 ) },
            heroPos : { value: new THREE.Vector3()},
            heroPosLast : { value: new THREE.Vector3()},
            shouldBeVisible : { value : false},
            trail: { value: [
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0),
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0),
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0),
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0)
            ]},
            trailOther: {
                value: [
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0),
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0),
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0),
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0), 
                    new THREE.Vector3(0,0,0)
                ]
            },
            trailCenter: {value: [
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0),
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0),
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0),
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0), 
                new THREE.Vector3(0,0,0)
            ]}
        },
        this.vertex = `
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {

                vNormal = normal;
                vUv = uv;
                vPosition = (vec4( position, 1.0 )).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

            }
        `;
        this.fragment = `
            
        varying vec2 vUv;
        uniform vec3 trail[36];
        uniform vec3 trailOther[36];
        uniform vec3 trailCenter[36];
        uniform bool shouldBeVisible;
  
        varying vec3 vPosition;
  
        //source : https://www.shadertoy.com/view/Wlfyzl
        float line_segment(in vec2 p, in vec2 a, in vec2 b) {
            vec2 ba = b - a;
            vec2 pa = p - a;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
            return length(pa - h * ba);
        }
  
              void main() {
          
          for (int i = 0; i < 5; i++) {
          vec3 t = trail[i];
          vec3 t_end = trail[i+1];
  
          float d = smoothstep(0.05,0.15, line_segment(vPosition.xy, t.xy, t_end.xy));
          vec3 col = vec3(0.8, 0.05, 0.);

          gl_FragColor += vec4(col, 1.-d);
  
          vec3 t2 = trailOther[i];
          vec3 t2_end = trailOther[i+1];
  
          float d2 = smoothstep(0.05,0.15, line_segment(vPosition.xy, t2.xy, t2_end.xy));
          vec3 col2 = vec3(0.8, 0.05, 0.);

          gl_FragColor += vec4(col2, 1.-d2);
          
          }
  
          for (int i = 0; i < 3; i++) {
  
          vec3 t3 = trailCenter[i];
          vec3 t3_end = trailCenter[i+1];
  
          vec2 v1 = vec2(0.,5.);
            vec2 v2 = vec2(5.,2.);
          vec2 pos = vec2(0., 0.);
          float d = smoothstep(0.05,0.15, line_segment(vPosition.xy, t3.xy, t3_end.xy));
          vec3 col = vec3(0.8, 0.05, 0.);
  
          gl_FragColor += vec4(col, 1.-d);
  
          }

          if (!shouldBeVisible) {
              gl_FragColor.a = 0.;
          }
  
              }
        `,

        this._material = new THREE.ShaderMaterial({
            fragmentShader: this.fragment,
            vertexShader: this.vertex,
            uniforms:this.uniforms,
            transparent:true,
            alphaTest:0.1,
            side:THREE.DoubleSide
        });
        //this._material = new THREE.MeshBasicMaterial({color:0xFFFFFF})
        this._vertices = null
        this._geometry = new THREE.PlaneGeometry( 80, 80 );
        this._position = new THREE.Vector3(5,20,0);
        this._followers = [];

    }

    get _vertexShader() {
        return this.vertex;
    }

    get _fragmentShader() {
        return this.fragment;
    }
    

    initFollowers(parent) {
        var geometry = new THREE.SphereGeometry(0.5,32,32);
		var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		var sph1 = new THREE.Mesh( geometry, material );
        sph1.name = "left";
         sph1.visible = false
        this._followers[0] = sph1
		scene.add( sph1 );

        var geometry2 = new THREE.SphereGeometry(0.5,32,32);
		var material2 = new THREE.MeshBasicMaterial( { color: 0xFF0000 } );
		var sph2 = new THREE.Mesh( geometry2, material2 );
        sph2.position.y = -0.1
        sph2.name = "right";
         sph2.visible = false
        this._followers[1] = sph2
		scene.add( sph2 );

        var geometry3 = new THREE.SphereGeometry(0.5,32,32);
		var material3 = new THREE.MeshBasicMaterial( { color: 0x0000FF } );
		var sph3 = new THREE.Mesh( geometry3, material3 );
        sph3.position.y = -0.1
         sph3.visible = false
        sph3.name = "center";
        this._followers[2] = sph3
        scene.add( sph3 );
        

        this._geometry = new THREE.BufferGeometry();
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.
        this._vertices = new Float32Array( [
            -40.0, -40.0,  -1.0,
            40.0, -40.0,  -1.0,
            40.0,  40.0,  -1.0,

            40.0,  40.0,  -1.0,
            -40.0,  40.0,  -1.0,
            -40.0, -40.0,  -1.0
        ] );

        // itemSize = 3 because there are 3 values (components) per vertex
        this._geometry.setAttribute( 'position', new THREE.BufferAttribute( this._vertices, 3 ) );
    }

    alignPoint(from, to, obj, orientation) {
        let orient = 0
        if (obj.name == "right") orient = 0.35;
        if (obj.name == "left") orient = -0.35;
        let facingPos = new THREE.Vector3().subVectors(from.position.clone(), to.lastPos);	//get facing pos
        let dir = facingPos.cross(new THREE.Vector3(0,0,1));	//get direction
        dir.normalize();	//normalize it
        dir.multiplyScalar(orient);	//get offset vector
        obj.position.copy(from.position.clone().add(dir));	//displace
       // obj.position.z = from.position.clone().z;

      // console.log(obj.name)
    }

    shiftToRight(arr, side) {
        //insert new point
        const mesh = side;
        let progressArr = [mesh.position.clone(), ...arr];
        //remove trailing point
        progressArr.pop();
        //return new points array
        return progressArr;
      }

      update(hero) {
        
        this.uniforms.trail.value = this.shiftToRight(this.uniforms.trail.value, this._followers[0]);
        this.uniforms.trailOther.value = this.shiftToRight(this.uniforms.trailOther.value, this._followers[1]);
        this.uniforms.trailCenter.value = this.shiftToRight(this.uniforms.trailCenter.value, this._followers[2]);



        this.alignPoint(hero, hero, this._followers[0]);
        this.alignPoint(hero, hero, this._followers[1]);
        this.alignPoint(hero, hero, this._followers[2]);
      
    }

}