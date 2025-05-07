export class BurstShader {
    constructor() {
        this.uniforms = { 
            color: { value: new THREE.Color( 0xFF0000 ) },
            //pointTexture: {value: new THREE.TextureLoader().load( "../../img/sheet.png" )},
            pointTexture: {value: null},
            isVisible: { value: 0.0},
            livetime: { value : 0.0 },
            heroPos : { value: new THREE.Vector3()}
        },
        this.vertex = `
            attribute float size;
            attribute float spriteIds;
            varying float vSpriteIds;
            varying float vSize;
            uniform float livetime;
            uniform float pointID;
            uniform vec3 heroPos;
            
            //attribute vec3 customColor;
            varying vec2 vUv;

            //varying vec3 vColor;
            
            float random(float n) {
                return fract(sin(n) * 43758.5453123);
            }

			void main() {

                float pindex = pointID;


                    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

                    gl_PointSize = size * ( 300.0 / -mvPosition.z );
                    
                    vSize = gl_PointSize;

                    gl_Position = projectionMatrix * vec4(mvPosition.xyz, 1.);
                
			}
        `;
        this.fragment = `
            
            uniform vec3 color;
            uniform sampler2D pointTexture;
            uniform float isVisible;
            uniform float livetime;
            varying float vSpriteIds;
            varying float vSize;
            //varying vec3 vColor;

            void main() {

                //gl_FragColor = vec4( color * vColor, 1.0 );
               // gl_FragColor = vec4( color, 1.0 );

               float mid = 0.5 ;
               
               vec2 ptCoords = vec2(gl_PointCoord.x/2., gl_PointCoord.y) + vec2(vSpriteIds/2., 0.);
               vec2 rotated = vec2(
                                    (cos(livetime) * (gl_PointCoord.x - mid) + sin(livetime) * (gl_PointCoord.y - mid)  + mid) /2. + vec2(vSpriteIds/2., 0.).x,
                                    (cos(livetime) * (gl_PointCoord.y - mid) - sin(livetime) * (gl_PointCoord.x - mid) + mid) + vec2(vSpriteIds/2., 0.).y
                                   );
                
                float shouldShow = (vSize > 0.) ? 1. : 0.;
                vec3 missileColor = vec3(195.0/256.0,95.0/256.0, 93.0/256.0);
                gl_FragColor = vec4( vec3(1.), isVisible * shouldShow ) * texture2D( pointTexture, rotated );

            }
        `
    }

    get _vertexShader() {
        return this.vertex;
    }

    get _fragmentShader() {
        return this.fragment;
    }
}