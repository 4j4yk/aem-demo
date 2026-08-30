# Automotive newsroom content model

This independent reference implementation demonstrates an enterprise editorial
experience without using proprietary automotive content, systems, or assets.

## Story fields

| Field | Purpose | Example |
| --- | --- | --- |
| Title | Editorial headline and link label | Engineering an electric platform around people |
| Description | Searchable card summary and SEO description | A cross-functional team explains… |
| Hero image | Responsive card and article media | Original, unbranded editorial photograph |
| Author | Byline and searchable expertise | Maya Chen, Technology Correspondent |
| Published | Publication date | August 29, 2026 |
| Category | Primary newsroom filter | Innovation |
| Tags | Secondary discovery terms | Electric, engineering, software |
| Region | Localization and governance context | North America |
| Reading time | Automatically calculated when omitted | 4 min read |
| Related URL | Story detail or downstream conversion | /stories/electric-platform |

## Authoring contracts

### Newsroom

Each block row represents one story. The first cell may contain an image. The
content cell contains a bold category, linked heading, summary, byline/date, and
story link. The block derives its filter controls and searchable text from that
authored content.

### Article metadata

Each row contains a field name and value. Field names become visually hidden
definition terms while values remain visible as a compact byline. Reading time
is calculated from the page when the author does not provide it.

### Story gallery

Each row contains an image and optional caption. The block produces semantic
figures, optimized responsive pictures, and readable captions.

## Governance

- Authors own story text, taxonomy, ordering, links, and media selection.
- Developers own resilient block decoration, accessibility, and presentation.
- Reviewers validate rights metadata, alt text, regional suitability, and SEO.
- Preview and production publishing remain separate operations.
