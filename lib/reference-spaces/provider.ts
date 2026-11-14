export type ReferenceSpace = { id: string; title: string; areaM2?: number; imageUrl?: string; embedUrl?: string; source: string };

export interface ReferenceSpaceProvider {
  isAvailable(): boolean;
  findSimilarSpaces(input: { approxAreaM2: number; near?: { lat: number; lng: number } }): Promise<ReferenceSpace[]>;
}

/** Default. CoStar / Matterport endpoints and credentials could not be confirmed, so nothing is called. */
export class NullReferenceSpaceProvider implements ReferenceSpaceProvider {
  isAvailable() { return false; }
  async findSimilarSpaces() { return []; }
}

export function getReferenceSpaceProvider(): ReferenceSpaceProvider {
  return new NullReferenceSpaceProvider();
}
