import { Vector3 } from 'three';
import { PlanetInfo } from '../store';

export interface CosmicPlanetLayout extends PlanetInfo {
  visualRadius: number;
  atmosphereColor: string;
  hasRings: boolean;
  orbitRadius: number;
  pos: Vector3;
}

export function computeCosmicPlanetPositions(planets: PlanetInfo[]): CosmicPlanetLayout[] {
  return planets.map((p, i) => {
    let visualRadius = 380;
    let atmosphereColor = '#38bdf8';
    let hasRings = false;
    let dist = 5000;
    let angle = (i / Math.max(1, planets.length)) * Math.PI * 2;
    const height = ((i % 3) - 1) * 350;

    switch (p.type) {
      case 'mercury':
        visualRadius = 180;
        atmosphereColor = '#a8a29e';
        dist = 3550;
        angle = 0.45;
        break;
      case 'venus':
        visualRadius = 360;
        atmosphereColor = '#fbbf24';
        dist = 5000;
        angle = 1.35;
        break;
      case 'earth':
        visualRadius = 380;
        atmosphereColor = '#38bdf8';
        dist = 6200;
        angle = 2.40;
        break;
      case 'moon':
        visualRadius = 140;
        atmosphereColor = '#cbd5e1';
        return {
          ...p,
          visualRadius,
          atmosphereColor,
          hasRings: false,
          orbitRadius: 6200,
          pos: new Vector3(
            Math.cos(2.40) * 6200 + 460,
            45,
            Math.sin(2.40) * 6200 + 320
          ),
        };
      case 'mars':
        visualRadius = 260;
        atmosphereColor = '#f97316';
        dist = 8400;
        angle = 3.65;
        break;
      case 'jupiter':
        visualRadius = 920;
        atmosphereColor = '#d97706';
        dist = 14200;
        angle = 4.70;
        break;
      case 'saturn':
        visualRadius = 780;
        atmosphereColor = '#eab308';
        hasRings = true;
        dist = 18000;
        angle = 5.60;
        break;
      case 'titan':
        visualRadius = 190;
        atmosphereColor = '#f59e0b';
        return {
          ...p,
          visualRadius,
          atmosphereColor,
          hasRings: false,
          orbitRadius: 18000,
          pos: new Vector3(
            Math.cos(5.60) * 18000 + 820,
            -60,
            Math.sin(5.60) * 18000 + 680
          ),
        };
      case 'uranus':
        visualRadius = 520;
        atmosphereColor = '#38bdf8';
        hasRings = true;
        dist = 22000;
        angle = 0.95;
        break;
      case 'neptune':
        visualRadius = 500;
        atmosphereColor = '#2563eb';
        dist = 25800;
        angle = 2.10;
        break;
      case 'exoplanet':
        visualRadius = 360 + (i * 65) % 280;
        atmosphereColor = '#a855f7';
        hasRings = i % 2 === 0;
        dist = 29000 + (i * 1400) % 8000;
        angle = (i * 1.618) * Math.PI * 2;
        break;
      default:
        visualRadius = 380;
        atmosphereColor = '#60a5fa';
        dist = 12000;
    }

    return {
      ...p,
      visualRadius,
      atmosphereColor,
      hasRings,
      orbitRadius: dist,
      pos: new Vector3(
        Math.cos(angle) * dist,
        height,
        Math.sin(angle) * dist
      ),
    };
  });
}
