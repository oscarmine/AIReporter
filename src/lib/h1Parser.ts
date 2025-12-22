
export interface HackerOneReport {
    asset: string;
    weakness: string;
    severity: string;
    title: string;
    description: string;
    impact: string;
}

const SECTION_REGEX = {
    asset: /<<<ASSET>>>([\s\S]*?)<<<END_ASSET>>>/,
    weakness: /<<<WEAKNESS>>>([\s\S]*?)<<<END_WEAKNESS>>>/,
    severity: /<<<SEVERITY>>>([\s\S]*?)<<<END_SEVERITY>>>/,
    title: /<<<TITLE>>>([\s\S]*?)<<<END_TITLE>>>/,
    description: /<<<DESCRIPTION>>>([\s\S]*?)<<<END_DESCRIPTION>>>/,
    impact: /<<<IMPACT>>>([\s\S]*?)<<<END_IMPACT>>>/,
};

export function parseHackerOneReport(markdown: string): HackerOneReport {
    const extract = (regex: RegExp) => {
        const match = markdown.match(regex);
        return match ? match[1].trim() : '';
    };

    return {
        asset: extract(SECTION_REGEX.asset),
        weakness: extract(SECTION_REGEX.weakness),
        severity: extract(SECTION_REGEX.severity),
        title: extract(SECTION_REGEX.title),
        description: extract(SECTION_REGEX.description),
        impact: extract(SECTION_REGEX.impact),
    };
}
