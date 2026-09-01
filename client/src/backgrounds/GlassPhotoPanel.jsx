import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { makeChileanFlagTexture } from './flagTexture.js';
import { pickRandomPhoto } from './photoPool.js';

export default function GlassPhotoPanel() {
    const containerRef = useRef();

    useEffect(() => {
        const container = containerRef.current;
        let width = container.clientWidth || 1;
        let height = container.clientHeight || 1;
        let disposed = false;

        const scene = new THREE.Scene();

        function cameraDistanceFor(h) {
            // Shorter containers (e.g. the mobile top strip) pull the camera in
            // so the glass cube still reads as a hero element instead of a speck.
            return Math.min(7, Math.max(3.6, 7 * (h / 700)));
        }

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, cameraDistanceFor(height));

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.enableZoom = false;

        scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const backLight = new THREE.DirectionalLight(0xffffff, 3.0);
        backLight.position.set(-5, 2, -10);
        scene.add(backLight);
        const topLight = new THREE.DirectionalLight(0xffffff, 2.0);
        topLight.position.set(0, 10, 0);
        scene.add(topLight);
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
        frontLight.position.set(0, 2, 10);
        scene.add(frontLight);

        const group = new THREE.Group();
        scene.add(group);

        const photoGeo = new THREE.PlaneGeometry(1, 1);
        const photoMat = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide,
            roughness: 0.3,
            metalness: 0.05,
        });
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        photoMesh.renderOrder = 0;
        group.add(photoMesh);

        const photoScale = 1.2;
        function applyPhotoAspect(aspect) {
            if (aspect > 1) photoMesh.scale.set(photoScale, photoScale / aspect, 1);
            else photoMesh.scale.set(photoScale * aspect, photoScale, 1);
        }

        let photoTexture;
        const choice = pickRandomPhoto();
        if (choice.type === 'flag') {
            photoTexture = makeChileanFlagTexture();
            photoMat.map = photoTexture;
            photoMat.needsUpdate = true;
            applyPhotoAspect(3 / 2);
        } else {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(choice.url, (tex) => {
                if (disposed) {
                    tex.dispose();
                    return;
                }
                tex.colorSpace = THREE.SRGBColorSpace;
                photoTexture = tex;
                photoMat.map = tex;
                photoMat.needsUpdate = true;
                if (tex.image) applyPhotoAspect(tex.image.width / tex.image.height);
            });
        }

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1.0,
            opacity: 1.0,
            metalness: 0.0,
            roughness: 0.0,
            ior: 1.5,
            thickness: 1.2,
            attenuationColor: 0xffffff,
            attenuationDistance: 9999.0,
            specularIntensity: 1.0,
            envMapIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const glassGeo = new RoundedBoxGeometry(2.1, 2.1, 1.0, 32, 0.25);
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        glassMesh.renderOrder = 1;
        group.add(glassMesh);

        const rgbeLoader = new RGBELoader();
        rgbeLoader.load('/hdri/royal_esplanade_1k.hdr', (texture) => {
            if (disposed) return;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
        });

        const clock = new THREE.Clock();
        let raf;
        function animate() {
            raf = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const t = clock.elapsedTime;
            group.rotation.y += delta * 0.4;
            group.rotation.x = Math.cos(t * 0.4) * 0.15;
            group.rotation.z = Math.sin(t * 0.21) * 0.08;
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        function handleResize() {
            width = container.clientWidth || 1;
            height = container.clientHeight || 1;
            camera.aspect = width / height;
            camera.position.setLength(cameraDistanceFor(height));
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
            controls.dispose();
            renderer.dispose();
            glassGeo.dispose();
            glassMat.dispose();
            photoGeo.dispose();
            photoMat.dispose();
            photoTexture?.dispose();
            scene.environment?.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
}
