export interface MosaicTile<T> {
    item: T;
    index: number;
}

export type MosaicPattern = readonly [number, number, number];

export interface BuildMosaicRowsOptions {
    chunkSize?: number;
    patterns?: MosaicPattern[];
}

const DEFAULT_MOSAIC_PATTERN: MosaicPattern = [2, 2, 1];

/**
 * Builds mosaic rows from a chunked list of items.
 * Default pattern: [2, 2, 1] (2 small + 2 small + 1 full-width).
 * When multiple patterns are provided, they rotate per chunk.
 */
export function buildMosaicRows<T>(items: T[], options: BuildMosaicRowsOptions = {}): MosaicTile<T>[][] {
    const chunkSize = options.chunkSize ?? 5;
    const patterns = options.patterns?.length ? options.patterns : [DEFAULT_MOSAIC_PATTERN];

    const rows: MosaicTile<T>[][] = [];
    const tiles = items.map((item, index) => ({ item, index }));

    for (let i = 0; i < tiles.length; i += chunkSize) {
        const chunk = tiles.slice(i, i + chunkSize);
        const patternIndex = Math.floor(i / chunkSize) % patterns.length;
        const pattern = patterns[patternIndex];
        let cursor = 0;

        pattern.forEach((rowSize) => {
            const row = chunk.slice(cursor, cursor + rowSize);
            if (row.length > 0) {
                rows.push(row);
            }

            cursor += rowSize;
        });
    }

    return rows;
}
