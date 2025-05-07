export class HeroShader {
    constructor() {
        this.uniforms = { 
            breathTime: {value: 0.0}
        },
        this.vertex = `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 worldPosition;
        varying vec3 worldNormal;

        void main() {
        vUv = uv;

        worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;

        // Calculate the normal including the model rotation and scale
        worldNormal = normalize( vec3( modelMatrix * vec4( normal, 0.0 ) ) );
        
        gl_Position = projectionMatrix *
                        modelViewMatrix  *
                        vec4(position,1.0);
        }`;
        this.fragment = `
        uniform float breathTime;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        varying vec3 worldPosition;
        varying vec3 worldNormal;

        //TODO : MAKE LIGHTPOSITION == HERO POSITION + OFFSET ? 
        //==> MAKE THIS A UNIFORM

        void main() {

            
            vec3 lightPosition = vec3(0.0, 0.0, 10.);
            vec3 lightVector = normalize( lightPosition - worldPosition );

            // An example simple lighting effect, taking the dot product of the normal
            // (which way this pixel is pointing) and a user generated light position
            float brightness = dot( worldNormal, lightVector );
            
            //make it stronger
            brightness *= 3.;

            vec2 uv = vUv;
            vec3 color = vec3(0.8, 0.8, 0.0);
            float borderSize = 0.2 * sin(breathTime);
            float bandV = step(uv.x, 0.+borderSize) + step(1.-borderSize, uv.x);
            float bandH = step(uv.y, 0.+borderSize) + step(1.-borderSize, uv.y);
            float borders = clamp(bandV+bandH, 0.0, 1.0);
            
        
            // Fragment shaders set the gl_FragColor, which is a vector4 of
            // ( red, green, blue, alpha ).
            //gl_FragColor = vec4( vec3(1.) * vec3(borders) * color * brightness, 1.0 );
            gl_FragColor = vec4( vec3(1.) * vec3(borders) * color * brightness, 1.0 );
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